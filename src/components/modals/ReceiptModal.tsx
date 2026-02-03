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
  const dataEmissao = format(new Date(), "dd/MM/yyyy", { locale: ptBR });

  const getFormaPagamentoLabel = () => {
    if (account.formaPagamento === "promissoria") return "PROMISSÓRIA";
    if (account.formaPagamento === "avista") return "À VISTA";
    return "CARTÃO";
  };

  const generateReceiptHTML = (parcelaInfo?: Parcela) => `
    <div style="
      background-color: white;
      color: black;
      padding: 32px;
      max-width: 400px;
      margin: 0 auto;
      border: 1px solid #d1d5db;
      font-family: Arial, sans-serif;
      font-size: 14px;
      line-height: 1.5;
    ">
      <!-- Header -->
      <div style="
        text-align: center;
        border-bottom: 2px solid black;
        padding-bottom: 16px;
        margin-bottom: 16px;
      ">
        <h1 style="
          font-size: 18px;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 2px;
          margin: 0;
        ">
          Comprovante de Pagamento
        </h1>
        <div style="
          width: 96px;
          height: 2px;
          background-color: black;
          margin: 8px auto 0;
        "></div>
      </div>

      <!-- Store Info -->
      <div style="
        text-align: center;
        margin-bottom: 16px;
        padding-bottom: 16px;
        border-bottom: 1px solid #9ca3af;
      ">
        <p style="font-weight: bold; font-size: 16px; margin: 0 0 4px;">${settings.storeName || "CellStore"}</p>
        <p style="font-size: 13px; margin: 0 0 2px;">📞 ${settings.storePhone || "(00) 00000-0000"}</p>
        <p style="font-size: 13px; margin: 0;">📍 ${settings.storeAddress || "Endereço não configurado"}</p>
      </div>

      <!-- Client Info -->
      <div style="
        margin-bottom: 16px;
        padding-bottom: 16px;
        border-bottom: 1px solid #9ca3af;
      ">
        <p style="margin: 0 0 4px;"><span style="font-weight: 600;">Cliente:</span> ${account.cliente}</p>
        <p style="margin: 0;"><span style="font-weight: 600;">Telefone:</span> ${account.telefone}</p>
      </div>

      <!-- Description -->
      <div style="
        margin-bottom: 16px;
        padding-bottom: 16px;
        border-bottom: 1px solid #9ca3af;
      ">
        <p style="margin: 0 0 4px;"><span style="font-weight: 600;">Descrição:</span> ${account.descricao}</p>
        <p style="margin: 0;">
          <span style="font-weight: 600;">Forma de Pagamento:</span> ${getFormaPagamentoLabel()}
        </p>
      </div>

      <!-- Valor Box -->
      <div style="
        background-color: #f3f4f6;
        border: 2px solid black;
        padding: 16px;
        text-align: center;
        margin-bottom: 16px;
      ">
        ${parcelaInfo ? `
          <p style="font-weight: bold; font-size: 16px; text-transform: uppercase; margin: 0;">
            Parcela ${parcelaInfo.numero} de ${account.numeroParcelas}
          </p>
          <p style="font-size: 24px; font-weight: bold; margin: 8px 0 0;">
            R$ ${parcelaInfo.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
          <p style="font-size: 13px; margin: 4px 0 0;">
            Vencimento: ${parcelaInfo.dataVencimento}
          </p>
        ` : `
          <p style="font-weight: bold; font-size: 16px; text-transform: uppercase; margin: 0;">Valor Total</p>
          <p style="font-size: 24px; font-weight: bold; margin: 8px 0 0;">
            R$ ${account.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
        `}
      </div>

      <!-- Footer -->
      <div style="text-align: center; font-size: 13px;">
        <p style="margin: 0 0 16px;">Data de Emissão: ${dataEmissao}</p>
        <div style="
          padding-top: 32px;
          border-top: 1px solid #9ca3af;
          margin-top: 16px;
        ">
          <div style="
            border-bottom: 1px solid black;
            width: 192px;
            margin: 0 auto 4px;
          "></div>
          <p style="font-size: 12px; margin: 0;">Assinatura</p>
        </div>
      </div>
    </div>
  `;

  const handlePrint = () => {
    const parcelasToShow = selectedParcela === "all" 
      ? parcelas 
      : selectedParcela 
        ? [parcelas.find(p => p.numero === selectedParcela)!]
        : [undefined];

    const receiptsHTML = parcelasToShow
      .filter(Boolean)
      .map((p, index) => `
        ${index > 0 ? '<div style="page-break-before: always;"></div>' : ''}
        ${generateReceiptHTML(p as Parcela | undefined)}
      `)
      .join('');

    const finalHTML = selectedParcela ? receiptsHTML : generateReceiptHTML();

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Comprovante de Pagamento</title>
          <style>
            * { 
              margin: 0; 
              padding: 0; 
              box-sizing: border-box; 
            }
            body { 
              font-family: Arial, sans-serif; 
              padding: 20px;
              background: white;
            }
            @media print {
              body { 
                padding: 0; 
                margin: 0;
              }
              @page {
                margin: 10mm;
                size: auto;
              }
            }
          </style>
        </head>
        <body>
          ${finalHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 300);
  };

  const getCurrentParcela = (): Parcela | undefined => {
    if (typeof selectedParcela === "number") {
      return parcelas.find(p => p.numero === selectedParcela);
    }
    return undefined;
  };

  const currentParcela = getCurrentParcela();

  // Preview component with same styles
  const ReceiptPreview = ({ parcelaInfo }: { parcelaInfo?: Parcela }) => (
    <div 
      ref={receiptRef}
      style={{
        backgroundColor: "white",
        color: "black",
        padding: "32px",
        maxWidth: "400px",
        margin: "0 auto",
        border: "1px solid #d1d5db",
        fontFamily: "Arial, sans-serif",
        fontSize: "14px",
        lineHeight: 1.5,
      }}
    >
      {/* Header */}
      <div style={{
        textAlign: "center",
        borderBottom: "2px solid black",
        paddingBottom: "16px",
        marginBottom: "16px",
      }}>
        <h1 style={{
          fontSize: "18px",
          fontWeight: "bold",
          textTransform: "uppercase",
          letterSpacing: "2px",
          margin: 0,
        }}>
          Comprovante de Pagamento
        </h1>
        <div style={{
          width: "96px",
          height: "2px",
          backgroundColor: "black",
          margin: "8px auto 0",
        }} />
      </div>

      {/* Store Info */}
      <div style={{
        textAlign: "center",
        marginBottom: "16px",
        paddingBottom: "16px",
        borderBottom: "1px solid #9ca3af",
      }}>
        <p style={{ fontWeight: "bold", fontSize: "16px", margin: "0 0 4px" }}>{settings.storeName || "CellStore"}</p>
        <p style={{ fontSize: "13px", margin: "0 0 2px" }}>📞 {settings.storePhone || "(00) 00000-0000"}</p>
        <p style={{ fontSize: "13px", margin: 0 }}>📍 {settings.storeAddress || "Endereço não configurado"}</p>
      </div>

      {/* Client Info */}
      <div style={{
        marginBottom: "16px",
        paddingBottom: "16px",
        borderBottom: "1px solid #9ca3af",
      }}>
        <p style={{ margin: "0 0 4px" }}><span style={{ fontWeight: 600 }}>Cliente:</span> {account.cliente}</p>
        <p style={{ margin: 0 }}><span style={{ fontWeight: 600 }}>Telefone:</span> {account.telefone}</p>
      </div>

      {/* Description */}
      <div style={{
        marginBottom: "16px",
        paddingBottom: "16px",
        borderBottom: "1px solid #9ca3af",
      }}>
        <p style={{ margin: "0 0 4px" }}><span style={{ fontWeight: 600 }}>Descrição:</span> {account.descricao}</p>
        <p style={{ margin: 0 }}>
          <span style={{ fontWeight: 600 }}>Forma de Pagamento:</span> {getFormaPagamentoLabel()}
        </p>
      </div>

      {/* Valor Box */}
      <div style={{
        backgroundColor: "#f3f4f6",
        border: "2px solid black",
        padding: "16px",
        textAlign: "center",
        marginBottom: "16px",
      }}>
        {parcelaInfo ? (
          <>
            <p style={{ fontWeight: "bold", fontSize: "16px", textTransform: "uppercase", margin: 0 }}>
              Parcela {parcelaInfo.numero} de {account.numeroParcelas}
            </p>
            <p style={{ fontSize: "24px", fontWeight: "bold", margin: "8px 0 0" }}>
              R$ {parcelaInfo.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
            <p style={{ fontSize: "13px", margin: "4px 0 0" }}>
              Vencimento: {parcelaInfo.dataVencimento}
            </p>
          </>
        ) : (
          <>
            <p style={{ fontWeight: "bold", fontSize: "16px", textTransform: "uppercase", margin: 0 }}>Valor Total</p>
            <p style={{ fontSize: "24px", fontWeight: "bold", margin: "8px 0 0" }}>
              R$ {account.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </>
        )}
      </div>

      {/* Footer */}
      <div style={{ textAlign: "center", fontSize: "13px" }}>
        <p style={{ margin: "0 0 16px" }}>Data de Emissão: {dataEmissao}</p>
        <div style={{
          paddingTop: "32px",
          borderTop: "1px solid #9ca3af",
          marginTop: "16px",
        }}>
          <div style={{
            borderBottom: "1px solid black",
            width: "192px",
            margin: "0 auto 4px",
          }} />
          <p style={{ fontSize: "12px", margin: 0 }}>Assinatura</p>
        </div>
      </div>
    </div>
  );

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
        <div className="border rounded-lg p-4 bg-white overflow-auto">
          {selectedParcela === "all" && parcelas.length > 0 ? (
            <div className="space-y-8">
              {parcelas.map((p) => (
                <ReceiptPreview key={p.numero} parcelaInfo={p} />
              ))}
            </div>
          ) : (
            <ReceiptPreview parcelaInfo={currentParcela} />
          )}
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
