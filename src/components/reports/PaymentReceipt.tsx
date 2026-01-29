import { forwardRef } from "react";
import { Account, AppSettings, Parcela } from "@/types";
import { format, addMonths, parse } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PaymentReceiptProps {
  account: Account;
  settings: AppSettings;
  parcela?: Parcela;
  showAllParcelas?: boolean;
}

export const PaymentReceipt = forwardRef<HTMLDivElement, PaymentReceiptProps>(
  ({ account, settings, parcela, showAllParcelas }, ref) => {
    const generateParcelas = (): Parcela[] => {
      if (account.formaPagamento !== "promissoria" || !account.numeroParcelas) {
        return [];
      }

      const numParcelas = account.numeroParcelas;
      const valorParcela = account.valor / numParcelas;
      const parcelas: Parcela[] = [];

      // Parse the due date
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
    const dataEmissao = format(new Date(), "dd/MM/yyyy", { locale: ptBR });

    const renderReceipt = (parcelaInfo?: Parcela) => (
      <div className="bg-white text-black p-8 max-w-md mx-auto border border-gray-300 print:border-black">
        {/* Header */}
        <div className="text-center border-b-2 border-black pb-4 mb-4">
          <h1 className="text-xl font-bold uppercase tracking-wider">
            Comprovante de Pagamento
          </h1>
          <div className="w-24 h-0.5 bg-black mx-auto mt-2" />
        </div>

        {/* Store Info */}
        <div className="text-center mb-4 pb-4 border-b border-gray-400">
          <p className="font-bold text-lg">{settings.storeName || "CellStore"}</p>
          <p className="text-sm">📞 {settings.storePhone || "(00) 00000-0000"}</p>
          <p className="text-sm">📍 {settings.storeAddress || "Endereço não configurado"}</p>
        </div>

        {/* Client Info */}
        <div className="mb-4 pb-4 border-b border-gray-400">
          <p><span className="font-semibold">Cliente:</span> {account.cliente}</p>
          <p><span className="font-semibold">Telefone:</span> {account.telefone}</p>
        </div>

        {/* Description */}
        <div className="mb-4 pb-4 border-b border-gray-400">
          <p><span className="font-semibold">Descrição:</span> {account.descricao}</p>
          <p>
            <span className="font-semibold">Forma de Pagamento:</span>{" "}
            {account.formaPagamento === "promissoria" ? "PROMISSÓRIA" : 
             account.formaPagamento === "avista" ? "À VISTA" : "CARTÃO"}
          </p>
        </div>

        {/* Parcela Info (for promissória) */}
        {parcelaInfo && (
          <div className="bg-gray-100 border-2 border-black p-4 text-center mb-4">
            <p className="font-bold text-lg uppercase">
              Parcela {parcelaInfo.numero} de {account.numeroParcelas}
            </p>
            <p className="text-2xl font-bold mt-2">
              R$ {parcelaInfo.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
            <p className="text-sm mt-1">
              Vencimento: {parcelaInfo.dataVencimento}
            </p>
          </div>
        )}

        {/* Total for non-parcela or avista */}
        {!parcelaInfo && (
          <div className="bg-gray-100 border-2 border-black p-4 text-center mb-4">
            <p className="font-bold text-lg uppercase">Valor Total</p>
            <p className="text-2xl font-bold mt-2">
              R$ {account.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="text-sm text-center space-y-2">
          <p>Data de Emissão: {dataEmissao}</p>
          <div className="pt-8 border-t border-gray-400 mt-4">
            <div className="border-b border-black w-48 mx-auto mb-1" />
            <p className="text-xs">Assinatura</p>
          </div>
        </div>
      </div>
    );

    return (
      <div ref={ref} className="print:p-0">
        {parcela ? (
          renderReceipt(parcela)
        ) : showAllParcelas && parcelas.length > 0 ? (
          <div className="space-y-8 print:space-y-0">
            {parcelas.map((p, index) => (
              <div key={p.numero} className={index > 0 ? "print:break-before-page" : ""}>
                {renderReceipt(p)}
              </div>
            ))}
          </div>
        ) : (
          renderReceipt()
        )}
      </div>
    );
  }
);

PaymentReceipt.displayName = "PaymentReceipt";
