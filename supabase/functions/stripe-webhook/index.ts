// supabase/functions/stripe-webhook/index.ts
// Handles Stripe events to sync subscription state into tenants + subscriptions tables.
// verify_jwt = false (configured in supabase/config.toml) — signature verification is done in code.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const PRICE_TO_PLAN: Record<string, string> = {
  price_1Tf8fCConXjx1MMDBtmQQeKT: "pro",
  price_1Tf8fUConXjx1MMDSWevuRUy: "business",
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "stripe-signature, content-type",
};

const stripeKey = Deno.env.get("STRIPE_SECRET_KEY")!;
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;
const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  { auth: { persistSession: false } }
);

async function syncSubscription(subscription: Stripe.Subscription) {
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;

  // Find tenant by stripe_customer_id, fallback to metadata
  let tenantId: string | null = null;
  const { data: byCustomer } = await supabase
    .from("tenants")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();
  if (byCustomer) tenantId = byCustomer.id;
  if (!tenantId && subscription.metadata?.tenant_id) {
    tenantId = subscription.metadata.tenant_id as string;
    await supabase
      .from("tenants")
      .update({ stripe_customer_id: customerId })
      .eq("id", tenantId);
  }
  if (!tenantId) {
    console.warn("[stripe-webhook] no tenant for customer", customerId);
    return;
  }

  const priceId = subscription.items.data[0]?.price.id ?? null;
  const plano = priceId ? PRICE_TO_PLAN[priceId] ?? "free" : "free";
  const status = subscription.status;
  const periodEnd = subscription.current_period_end
    ? new Date(subscription.current_period_end * 1000).toISOString()
    : null;
  const periodStart = subscription.current_period_start
    ? new Date(subscription.current_period_start * 1000).toISOString()
    : null;

  // Upsert subscription row
  await supabase.from("subscriptions").upsert(
    {
      tenant_id: tenantId,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
      stripe_price_id: priceId,
      plano,
      status,
      current_period_start: periodStart,
      current_period_end: periodEnd,
      cancel_at_period_end: subscription.cancel_at_period_end,
      canceled_at: subscription.canceled_at
        ? new Date(subscription.canceled_at * 1000).toISOString()
        : null,
    },
    { onConflict: "stripe_subscription_id" }
  );

  // Mirror to tenants for fast access checks
  await supabase
    .from("tenants")
    .update({
      plano,
      status,
      stripe_subscription_id: subscription.id,
      current_period_end: periodEnd,
    })
    .eq("id", tenantId);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) return new Response("Missing signature", { status: 400 });

  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig, webhookSecret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[stripe-webhook] signature error", msg);
    return new Response(`Webhook Error: ${msg}`, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.subscription) {
          const sub = await stripe.subscriptions.retrieve(
            session.subscription as string
          );
          await syncSubscription(sub);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        await syncSubscription(event.data.object as Stripe.Subscription);
        break;
      }
      default:
        // ignore
        break;
    }
    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[stripe-webhook] handler error", msg);
    return new Response(JSON.stringify({ error: msg }), { status: 500 });
  }
});
