import { useState, useRef, useEffect } from "react";
import { useClients, type Client } from "@/hooks/useClients";
import { User, Check, UserPlus } from "lucide-react";

interface ClientPickerProps {
  value: string;
  onChange: (name: string) => void;
  onSelect?: (client: Client | null) => void;
  placeholder?: string;
  required?: boolean;
}

export function ClientPicker({
  value,
  onChange,
  onSelect,
  placeholder = "Nome do cliente",
  required,
}: ClientPickerProps) {
  const { clients, loading } = useClients();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const term = value.trim().toLowerCase();
  const exactMatch = clients.find((c) => c.nome.toLowerCase() === term);
  const filtered = clients
    .filter((c) =>
      !term
        ? true
        : c.nome.toLowerCase().includes(term) ||
          (c.telefone || "").toLowerCase().includes(term)
    )
    .slice(0, 8);

  return (
    <div ref={wrapRef} className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          // Clear vincular se usuário começou a digitar
          onSelect?.(null);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        required={required}
        className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        autoComplete="off"
      />
      {open && (
        <div className="absolute z-50 mt-1 max-h-72 w-full overflow-auto rounded-lg border border-border bg-popover shadow-lg">
          {loading ? (
            <div className="px-3 py-2 text-xs text-muted-foreground">Carregando...</div>
          ) : (
            <>
              {term && !exactMatch && (
                <div className="flex items-center gap-2 border-b border-border bg-accent/30 px-3 py-2 text-xs">
                  <UserPlus className="h-4 w-4 text-primary" />
                  <span>
                    Novo cliente: <strong className="text-foreground">{value}</strong>
                  </span>
                </div>
              )}
              {filtered.length === 0 ? (
                <div className="px-3 py-2 text-xs text-muted-foreground">
                  {clients.length === 0
                    ? "Nenhum cliente cadastrado ainda."
                    : "Nenhum cliente encontrado."}
                </div>
              ) : (
                <>
                  <div className="px-3 py-1.5 text-[10px] uppercase tracking-wide text-muted-foreground border-b border-border">
                    Clientes cadastrados ({clients.length})
                  </div>
                  {filtered.map((c) => {
                    const selected = c.nome === value;
                    return (
                      <button
                        type="button"
                        key={c.id}
                        onClick={() => {
                          onChange(c.nome);
                          onSelect?.(c);
                          setOpen(false);
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent"
                      >
                        <User className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="truncate font-medium">{c.nome}</div>
                          {c.telefone && (
                            <div className="truncate text-xs text-muted-foreground">
                              {c.telefone}
                            </div>
                          )}
                        </div>
                        {selected && <Check className="h-4 w-4 text-primary" />}
                      </button>
                    );
                  })}
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
