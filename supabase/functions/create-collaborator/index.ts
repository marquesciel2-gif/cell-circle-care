import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PLAN_USER_LIMITS: Record<string, number> = {
  free: 1,
  trial: Infinity,
  pro: Infinity,
  business: Infinity,
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: claimsData, error: claimsError } = await supabaseUser.auth.getClaims(
      authHeader.replace("Bearer ", "")
    );
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Token inválido" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const callerUserId = claimsData.claims.sub;

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Resolve caller's tenant
    const { data: callerMember } = await supabaseAdmin
      .from("tenant_members")
      .select("tenant_id")
      .eq("user_id", callerUserId)
      .limit(1)
      .maybeSingle();

    if (!callerMember?.tenant_id) {
      return new Response(
        JSON.stringify({ error: "Tenant não encontrado para o usuário" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const tenantId = callerMember.tenant_id as string;

    // Caller must be admin in this tenant
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", callerUserId)
      .eq("tenant_id", tenantId)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(
        JSON.stringify({ error: "Apenas administradores podem cadastrar colaboradores" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Enforce plan user limits
    const { data: tenant } = await supabaseAdmin
      .from("tenants")
      .select("plano, status")
      .eq("id", tenantId)
      .maybeSingle();

    const effectivePlan = tenant?.status === "trialing" ? "trial" : tenant?.plano ?? "free";
    const userLimit = PLAN_USER_LIMITS[effectivePlan] ?? 1;

    const { count: memberCount } = await supabaseAdmin
      .from("tenant_members")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId);

    if ((memberCount ?? 0) >= userLimit) {
      return new Response(
        JSON.stringify({
          error: `Limite de usuários do plano ${effectivePlan} atingido (${userLimit}). Faça upgrade para adicionar mais.`,
        }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { email, password, nome, roles } = await req.json();

    if (!email || !password || !nome) {
      return new Response(
        JSON.stringify({ error: "Nome, e-mail e senha são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (password.length < 6) {
      return new Response(
        JSON.stringify({ error: "Senha deve ter no mínimo 6 caracteres" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!roles || !Array.isArray(roles) || roles.length === 0) {
      return new Response(
        JSON.stringify({ error: "Selecione pelo menos um papel" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const validRoles = ["admin", "tecnico", "vendedor"];
    for (const r of roles) {
      if (!validRoles.includes(r)) {
        return new Response(
          JSON.stringify({ error: `Papel inválido: ${r}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // handle_new_user trigger will auto-create a tenant + admin role for the new user.
    // We undo that and attach them to the caller's tenant instead.
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { nome: nome.trim() },
    });

    if (createError) {
      const msg = createError.message?.includes("already been registered")
        ? "Este e-mail já está cadastrado"
        : `Erro ao criar usuário: ${createError.message}`;
      return new Response(
        JSON.stringify({ error: msg }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const newUserId = newUser.user.id;

    // Cleanup auto-created tenant from handle_new_user trigger (cascades members + roles)
    const { data: autoTenant } = await supabaseAdmin
      .from("tenants")
      .select("id")
      .eq("owner_id", newUserId)
      .maybeSingle();
    if (autoTenant?.id) {
      await supabaseAdmin.from("tenants").delete().eq("id", autoTenant.id);
    }

    // Ensure profile exists
    await supabaseAdmin
      .from("profiles")
      .upsert({ user_id: newUserId, nome: nome.trim() }, { onConflict: "user_id" });

    // Attach to caller's tenant
    const { error: memberError } = await supabaseAdmin
      .from("tenant_members")
      .insert({ tenant_id: tenantId, user_id: newUserId });
    if (memberError) {
      await supabaseAdmin.auth.admin.deleteUser(newUserId);
      return new Response(
        JSON.stringify({ error: `Erro ao vincular ao tenant: ${memberError.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const rolesToInsert = roles.map((role: string) => ({
      user_id: newUserId,
      role,
      tenant_id: tenantId,
    }));

    const { error: rolesError } = await supabaseAdmin
      .from("user_roles")
      .insert(rolesToInsert);

    if (rolesError) {
      return new Response(
        JSON.stringify({ error: `Erro ao atribuir papéis: ${rolesError.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, user_id: newUserId }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: `Erro interno: ${(err as Error).message}` }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
