// Plan and Stripe price definitions
export const PRICE_IDS = {
  basic: "price_1TqWyvConXjx1MMD7Xv27wRs",
  pro: "price_1Tf8fCConXjx1MMDBtmQQeKT",
  business: "price_1Tf8fUConXjx1MMDSWevuRUy",
} as const;

export type PlanId = "free" | "basic" | "pro" | "business";

export interface PlanDef {
  id: PlanId;
  name: string;
  price: string;
  priceCents: number;
  priceId?: string;
  description: string;
  features: string[];
  highlight?: boolean;
}

export const PLANS: PlanDef[] = [
  {
    id: "basic",
    name: "Basic",
    price: "R$ 25",
    priceCents: 2500,
    priceId: PRICE_IDS.basic,
    description: "14 dias grátis. Depois R$25/mês para manter o acesso básico.",
    features: [
      "14 dias de teste gratuito",
      "1 usuário",
      "Até 50 clientes",
      "Estoque e consertos",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "R$ 49",
    priceCents: 4900,
    priceId: PRICE_IDS.pro,
    description: "Para lojas em crescimento.",
    features: [
      "Usuários ilimitados",
      "Clientes ilimitados",
      "Todos os módulos",
      "Relatórios avançados",
    ],
    highlight: true,
  },
  {
    id: "business",
    name: "Business",
    price: "R$ 99",
    priceCents: 9900,
    priceId: PRICE_IDS.business,
    description: "Para redes com várias lojas.",
    features: [
      "Tudo do Pro",
      "Multi-loja",
      "Suporte prioritário",
      "Onboarding dedicado",
    ],
  },
];

export function planFromPriceId(priceId: string | null | undefined): PlanId {
  if (priceId === PRICE_IDS.basic) return "basic";
  if (priceId === PRICE_IDS.pro) return "pro";
  if (priceId === PRICE_IDS.business) return "business";
  return "free";
}
