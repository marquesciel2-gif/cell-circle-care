import { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, FileText } from "lucide-react";
import { Account, AppSettings, Parcela } from "@/types";
import { PaymentReceipt } from "@/components/reports/PaymentReceipt";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { addMonths, parse, format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ReceiptModalProps {
  open: boolean;
  onClose: () => void;
  account: Account | null;
}

export function ReceiptModal({ open, onClose, account }: ReceiptModalProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [selectedParcela, setSelectedParcela] = useState<number | "all" | null>(null);
  const [settings] = useLocalStorage<AppSettings>("appSettings", {
    theme: "light",
    storeName: "CellStore",
    storePhone: "(00) 00000-0000",
    storeAddress: "Endereço não configurado",
  });

  if (!account) return null;

  const generateParcelas = (): Parcela[] => {
    if (account.formaPagamento !== "promissoria" || !account.numeroParcelas) {
      return [];
    }

    const numParcelas = account.numeroParcelas;
    const valorParcela = account.valor / numParcelas;
    const parcelas: Parcela[] = [];

    let baseDate: Date;
    try {
      baseDate = parse(account.dataVencimento, "dd/MM/yyyy", new Date());
    } catch {
      baseDate = new Date();
    }

    for (let i = 0; i < numParcelas; i++) {
      const dataVenc = addMonths(baseDate, i);
      parcelas.push({
        numero: i + 1,
        valor: valorParcela,
        dataVencimento: format(dataVenc, "dd/MM/yyyy", { locale: ptBR }),
        paga: (account.valorPago / valorParcela) > i,
      });
    }

    return parcelas;
  };

  const parcelas = generateParcelas();
  const isPromissoria = account.formaPagamento === "promissoria" && parcelas.length > 0;

  const handlePrint = () => {
    const printContent = receiptRef.current;
    if (!printContent) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Comprovante de Pagamento</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; padding: 20px; }
            .receipt { max-width: 400px; margin: 0 auto; }
            @media print {
              body { padding: 0; }
              .receipt { max-width: 100%; }
              .page-break { page-break-before: always; }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const getCurrentParcela = (): Parcela | undefined => {
    if (typeof selectedParcela === "number") {
      return parcelas.find(p => p.numero === selectedParcela);
    }
    return undefined;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Comprovante de Pagamento
          </DialogTitle>
        </DialogHeader>

        {/* Parcela Selection for Promissória */}
        {isPromissoria && (
          <div className="mb-4 p-4 bg-muted rounded-lg">
            <p className="text-sm font-medium mb-2">Selecione qual comprovante imprimir:</p>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={selectedParcela === "all" ? "default" : "outline"}
                onClick={() => setSelectedParcela("all")}
              >
                Todas as Parcelas
              </Button>
              {parcelas.map((p) => (
                <Button
                  key={p.numero}
                  size="sm"
                  variant={selectedParcela === p.numero ? "default" : "outline"}
                  onClick={() => setSelectedParcela(p.numero)}
                  className={p.paga ? "opacity-50" : ""}
                >
                  Parcela {p.numero}
                  {p.paga && " ✓"}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Receipt Preview */}
        <div className="border rounded-lg p-4 bg-white">
          <PaymentReceipt
            ref={receiptRef}
            account={account}
            settings={settings}
            parcela={getCurrentParcela()}
            showAllParcelas={selectedParcela === "all"}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
          <Button onClick={handlePrint} className="gradient-primary text-primary-foreground">
            <Printer className="mr-2 h-4 w-4" />
            Imprimir
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
