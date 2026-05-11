import { useState } from "react";
import { Plus, Search, User, Phone, Mail, MapPin, Calendar, Edit, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useClients, Client, ClientInput } from "@/hooks/useClients";
import { AddClientModal } from "@/components/modals/AddClientModal";
import { EditClientModal } from "@/components/modals/EditClientModal";
import { ClientDetailDrawer } from "@/components/clients/ClientDetailDrawer";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function ClientsSection() {
  const { clients, loading, addClient, updateClient, deleteClient } = useClients();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deletingClient, setDeletingClient] = useState<Client | null>(null);
  const [drawerClient, setDrawerClient] = useState<Client | null>(null);

  const filteredClients = clients.filter(
    (client) =>
      client.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.telefone && client.telefone.includes(searchTerm))
  );

  const handleAddClient = async (newClient: ClientInput) => {
    await addClient(newClient);
    setIsAddModalOpen(false);
  };

  const handleEditClient = async (id: string, updatedClient: ClientInput) => {
    await updateClient(id, updatedClient);
    setEditingClient(null);
  };

  const handleDeleteClient = async (id: string) => {
    await deleteClient(id);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Clientes</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie seus clientes cadastrados
          </p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Cliente
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou telefone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Client List */}
      {filteredClients.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <User className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-lg font-medium text-muted-foreground">
              {searchTerm ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado"}
            </p>
            <p className="text-sm text-muted-foreground">
              {searchTerm
                ? "Tente buscar por outro termo"
                : "Clique em 'Novo Cliente' para adicionar"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredClients.map((client) => (
            <Card key={client.id}>
              <CardContent className="p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1 space-y-2">
                    <button
                      type="button"
                      onClick={() => setDrawerClient(client)}
                      className="flex items-center gap-2 text-left hover:text-primary"
                    >
                      <User className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-semibold text-foreground hover:text-primary underline-offset-2 hover:underline">
                        {client.nome}
                      </h3>
                    </button>

                    <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                      {client.telefone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          <span>{client.telefone}</span>
                        </div>
                      )}

                      {client.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          <span>{client.email}</span>
                        </div>
                      )}

                      {client.endereco && (
                        <div className="flex items-center gap-2 sm:col-span-2">
                          <MapPin className="h-4 w-4" />
                          <span>{client.endereco}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>
                          Cadastrado em:{" "}
                          {format(new Date(client.created_at), "dd/MM/yyyy", {
                            locale: ptBR,
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setEditingClient(client)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setDeletingClient(client)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Total */}
      <div className="text-center text-sm text-muted-foreground">
        Total: {filteredClients.length} cliente{filteredClients.length !== 1 ? "s" : ""} {searchTerm && `encontrado${filteredClients.length !== 1 ? "s" : ""}`}
      </div>

      {/* Modals */}
      <AddClientModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onAdd={handleAddClient}
      />

      {editingClient && (
        <EditClientModal
          open={!!editingClient}
          onOpenChange={(open) => !open && setEditingClient(null)}
          client={editingClient}
          onSave={(data) => handleEditClient(editingClient.id, data)}
        />
      )}

      <AlertDialog
        open={!!deletingClient}
        onOpenChange={(open) => !open && setDeletingClient(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O cliente "{deletingClient?.nome}" será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (deletingClient) {
                  await handleDeleteClient(deletingClient.id);
                  setDeletingClient(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ClientDetailDrawer
        open={!!drawerClient}
        onClose={() => setDrawerClient(null)}
        clientId={drawerClient?.id ?? null}
        fallbackName={drawerClient?.nome ?? ""}
      />
    </div>
  );
}
