// Plan and Stripe price definitions
export const PRICE_IDS = {
  pro: "price_1Tf8fCConXjx1MMDBtmQQeKT",
  business: "price_1Tf8fUConXjx1MMDSWevuRUy",
} as const;

export type PlanId = "free" | "pro" | "business";

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
    id: "free",
    name: "Free",
    price: "R$ 0",
    priceCents: 0,
    description: "Para começar a operar a loja sem custo.",
    features: [
      "1 usuário",
      "Até 50 clientes",
      "Estoque e consertos",
      "Sem relatórios avançados",
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
  if (priceId === PRICE_IDS.pro) return "pro";
  if (priceId === PRICE_IDS.business) return "business";
  return "free";
}
