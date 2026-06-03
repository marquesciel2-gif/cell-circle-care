import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Smartphone,
  Package,
  Wrench,
  Users,
  Receipt,
  BarChart3,
  Check,
  ArrowRight,
} from "lucide-react";

const features = [
  { icon: Package, title: "Estoque Inteligente", desc: "Aparelhos novos, usados, acessórios e eletros num só lugar." },
  { icon: Wrench, title: "Ordens de Conserto", desc: "Acompanhe cada reparo do recebimento à entrega." },
  { icon: Users, title: "Cadastro de Clientes", desc: "Ficha completa com histórico de compras e consertos." },
  { icon: Receipt, title: "Contas a Receber", desc: "Promissórias, parcelas e recibos prontos para imprimir." },
  { icon: BarChart3, title: "Relatórios", desc: "Vendas, despesas e fluxo de caixa em tempo real." },
  { icon: Smartphone, title: "Multi-loja", desc: "Cada loja com seus dados, equipe e permissões isolados." },
];

const plans = [
  {
    name: "Free",
    price: "R$ 0",
    period: "/mês",
    desc: "Para começar agora",
    features: ["1 usuário", "Até 50 clientes", "Estoque básico", "Suporte por e-mail"],
    cta: "Começar grátis",
    highlight: false,
  },
  {
    name: "Pro",
    price: "R$ 49",
    period: "/mês",
    desc: "Para lojas em crescimento",
    features: ["Até 3 usuários", "Clientes ilimitados", "Consertos e recibos", "Relatórios completos", "Suporte prioritário"],
    cta: "Testar 14 dias grátis",
    highlight: true,
  },
  {
    name: "Business",
    price: "R$ 99",
    period: "/mês",
    desc: "Para operações maiores",
    features: ["Usuários ilimitados", "Multi-loja", "API e integrações", "Backup automático", "Suporte dedicado"],
    cta: "Testar 14 dias grátis",
    highlight: false,
  },
];

const faqs = [
  { q: "Preciso de cartão de crédito para começar?", a: "Não. Você cria sua conta e usa o plano Free ou o trial Pro de 14 dias sem informar cartão." },
  { q: "Posso mudar de plano depois?", a: "Sim. Você pode fazer upgrade ou downgrade a qualquer momento direto no painel da sua loja." },
  { q: "Meus dados ficam isolados de outras lojas?", a: "Sim. Cada loja tem seu próprio espaço com isolamento completo de dados e permissões por usuário." },
  { q: "Funciona em celular e tablet?", a: "Sim. A plataforma é 100% responsiva e funciona em qualquer dispositivo com navegador moderno." },
  { q: "Consigo emitir recibos e ordens de serviço?", a: "Sim. Você gera recibos de venda, parcelas e ordens de conserto prontos para impressão." },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-primary">
              <Smartphone className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold">CellCircle</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a href="#funcionalidades" className="text-muted-foreground hover:text-foreground">Funcionalidades</a>
            <a href="#planos" className="text-muted-foreground hover:text-foreground">Planos</a>
            <a href="#faq" className="text-muted-foreground hover:text-foreground">FAQ</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link to="/login">Entrar</Link>
            </Button>
            <Button asChild>
              <Link to="/cadastro">Cadastre-se</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-20 md:py-28 text-center">
        <div className="mx-auto max-w-3xl">
          <span className="inline-flex items-center rounded-full border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground mb-6">
            14 dias grátis · Sem cartão de crédito
          </span>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Gerencie sua loja de celulares <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">do jeito certo</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8">
            Estoque, vendas, consertos, clientes e finanças — tudo num só lugar.
            Feito para lojas que querem crescer sem perder o controle.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" asChild>
              <Link to="/cadastro">
                Começar grátis <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="#planos">Ver planos</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="funcionalidades" className="container mx-auto px-4 py-20 border-t">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">Tudo que sua loja precisa</h2>
          <p className="text-muted-foreground">Recursos pensados para a rotina real de uma assistência técnica.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <Card key={f.title} className="border-2 transition-colors hover:border-primary/50">
              <CardContent className="pt-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                  <f.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Plans */}
      <section id="planos" className="container mx-auto px-4 py-20 border-t">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">Planos para cada tamanho de loja</h2>
          <p className="text-muted-foreground">Escolha o que cabe agora. Você pode mudar quando quiser.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((p) => (
            <Card key={p.name} className={p.highlight ? "border-primary border-2 shadow-lg relative" : ""}>
              {p.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                  Mais popular
                </span>
              )}
              <CardContent className="pt-6">
                <h3 className="text-xl font-bold mb-1">{p.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{p.desc}</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold">{p.price}</span>
                  <span className="text-muted-foreground">{p.period}</span>
                </div>
                <Button className="w-full mb-6" variant={p.highlight ? "default" : "outline"} asChild>
                  <Link to="/cadastro">{p.cta}</Link>
                </Button>
                <ul className="space-y-2">
                  {p.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="container mx-auto px-4 py-20 border-t max-w-3xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">Perguntas frequentes</h2>
        </div>
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((f, i) => (
            <AccordionItem key={i} value={`item-${i}`}>
              <AccordionTrigger className="text-left">{f.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-20 border-t">
        <Card className="bg-primary text-primary-foreground border-0">
          <CardContent className="py-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Pronto para organizar sua loja?</h2>
            <p className="opacity-90 mb-6">Comece grátis hoje. 14 dias de Pro sem cartão de crédito.</p>
            <Button size="lg" variant="secondary" asChild>
              <Link to="/cadastro">
                Criar minha conta <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t">
        <div className="container mx-auto px-4 py-10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded gradient-primary">
              <Smartphone className="h-4 w-4 text-primary-foreground" />
            </div>
            <span>© {new Date().getFullYear()} CellCircle. Todos os direitos reservados.</span>
          </div>
          <div className="flex gap-6">
            <Link to="/login" className="hover:text-foreground">Entrar</Link>
            <Link to="/cadastro" className="hover:text-foreground">Cadastre-se</Link>
            <a href="#planos" className="hover:text-foreground">Planos</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
