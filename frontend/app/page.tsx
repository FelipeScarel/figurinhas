"use client";

import { useState, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";
import GalleryCard from "@/components/GalleryCard";
import OrderConfigurator from "@/components/OrderConfigurator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  ChevronDown,
  Star,
  Shield,
  Palette,
  Truck,
  Zap,
  Gem,
  ArrowRight,
  Scissors,
  Wand2,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────
interface Figurinha {
  id: number;
  titulo: string;
  descricao: string;
  url_imagem: string;
  categoria_nome: string;
  categoria_slug: string;
  preco: number | null;
  tags?: string;
}

// ── Features ───────────────────────────────────────────────
const FEATURES = [
  {
    icon: Palette,
    title: "Acabamento Premium",
    desc: "Brilhante, Fosco Acetinado, Refletivo e Holográfico Luxo",
  },
  {
    icon: Shield,
    title: "Vinil de Alta Performance",
    desc: "Resistente a sol, chuva, lavagem e uso intenso",
  },
  {
    icon: Truck,
    title: "Entrega para Todo Brasil",
    desc: "Embalagem premium com rastreio gratuito",
  },
  {
    icon: Gem,
    title: "Design Exclusivo",
    desc: "Cada peça é tratada como obra de arte única",
  },
];

const TESTIMONIALS = [
  {
    initials: "RL",
    name: "Ricardo L.",
    detail: "Coleção Holográfica",
    text: "Os adesivos holográficos ficaram incríveis na minha capinha. Qualidade premium de verdade, entrega super rápida e embalagem impecável.",
  },
  {
    initials: "MA",
    name: "Marina A.",
    detail: "Kit Corporativo",
    text: "Encomendei adesivos para o lançamento da minha marca. Acabamento refletivo premium, todos elogiaram. Já virei cliente fiel!",
  },
  {
    initials: "JF",
    name: "João F.",
    detail: "Coleção Minimalista",
    text: "O acabamento fosco acetinado é de outro nível. A vitrine é linda e o configurador tornou o pedido muito simples. Resultado perfeito.",
  },
];

// ── Navbar ─────────────────────────────────────────────────
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const cb = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", cb, { passive: true });
    return () => window.removeEventListener("scroll", cb);
  }, []);

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
        scrolled
          ? "glass border-b border-graphite-800/50 py-3"
          : "bg-transparent py-4"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
        <a href="#" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-graphite-900 font-extrabold text-xs shadow-lg shadow-gold-500/20 group-hover:shadow-gold-500/30 transition-all">
            FS
          </div>
          <span className="font-bold text-white hidden sm:inline font-display text-lg">
            Figurinhas<span className="text-gold-400">.</span>
          </span>
        </a>

        <div className="flex items-center gap-2">
          <a href="#vitrine">
            <Button
              variant="ghost"
              size="sm"
              className="text-graphite-400 hover:text-white"
            >
              Vitrine
            </Button>
          </a>
          <a href="#configurador">
            <Button
              variant="ghost"
              size="sm"
              className="text-graphite-400 hover:text-white"
            >
              Configurador
            </Button>
          </a>
          <a href="/admin/login" target="_blank">
            <Button
              variant="ghost"
              size="sm"
              className="text-graphite-500 hover:text-graphite-300 text-xs"
            >
              Admin
            </Button>
          </a>
          <a href="#configurador">
            <Button
              size="sm"
              className="bg-gold-600 hover:bg-gold-500 text-graphite-900 rounded-full px-5 shadow-lg shadow-gold-600/15 font-semibold"
            >
              <Wand2 className="w-3.5 h-3.5 mr-1.5" />
              Criar Pedido
            </Button>
          </a>
        </div>
      </div>
    </nav>
  );
}

// ── Main Page ──────────────────────────────────────────────
export default function Home() {
  const [figurinhas, setFigurinhas] = useState<Figurinha[]>([]);
  const [activeCategoria, setActiveCategoria] = useState("all");
  const [categorias, setCategorias] = useState<{ nome: string; slug: string }[]>(
    []
  );
  const [selectedFig, setSelectedFig] = useState<Figurinha | null>(null);

  // Scroll parallax
  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 500], [1, 0]);
  const heroY = useTransform(scrollY, [0, 500], [0, -50]);

  // Fetch figurinhas from API
  useEffect(() => {
    fetch("/api/figurinhas")
      .then((r) => r.json())
      .then((data: Figurinha[]) => {
        setFigurinhas(data);
        const cats = new Map<string, { nome: string; slug: string }>();
        data.forEach((f) => {
          if (f.categoria_slug && !cats.has(f.categoria_slug)) {
            cats.set(f.categoria_slug, {
              nome: f.categoria_nome,
              slug: f.categoria_slug,
            });
          }
        });
        setCategorias(Array.from(cats.values()));
      })
      .catch(() => {});
  }, []);

  const filteredFigs =
    activeCategoria === "all"
      ? figurinhas
      : figurinhas.filter((f) => f.categoria_slug === activeCategoria);

  function handleSelectFig(fig: Figurinha) {
    setSelectedFig((prev) => (prev?.id === fig.id ? null : fig));
  }

  return (
    <div className="min-h-screen bg-graphite-900 text-white overflow-x-hidden">
      <Navbar />

      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="relative min-h-[90vh] flex items-center justify-center pt-20 pb-16">
        {/* Background effects */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(212,175,55,0.08),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_40%_at_80%_50%,rgba(212,175,55,0.04),transparent)]" />

        <motion.div
          style={{ opacity: heroOpacity, y: heroY }}
          className="relative z-10 max-w-4xl mx-auto px-4 text-center"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="mb-6"
          >
            <Badge className="px-4 py-1.5 text-xs gap-1.5 border-gold-500/20 bg-gold-500/5 text-gold-400 font-medium">
              <Sparkles className="w-3 h-3" />
              Coleção Premium 2026
            </Badge>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.7 }}
            className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-tight mb-6"
          >
            Adesivos de{" "}
            <span className="text-gradient-gold">Luxo Premium</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.7 }}
            className="text-base sm:text-lg text-graphite-400 max-w-2xl mx-auto leading-relaxed mb-8"
          >
            Do design minimalista ao holográfico. Peças exclusivas com{" "}
            <span className="text-graphite-300">acabamentos premium</span>{" "}
            que transformam superfícies em arte. Cada adesivo é tratado como
            uma obra-prima.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.7 }}
            className="flex items-center justify-center gap-4 flex-wrap"
          >
            <a href="#vitrine">
              <Button
                size="lg"
                className="bg-gold-600 hover:bg-gold-500 text-graphite-900 rounded-full px-8 h-12 font-bold shadow-lg shadow-gold-600/15 hover:shadow-gold-500/25 transition-all text-sm"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Explorar Coleção
              </Button>
            </a>
            <a href="#configurador">
              <Button
                variant="outline"
                size="lg"
                className="rounded-full px-8 h-12 border-graphite-700 text-graphite-300 hover:text-white hover:border-gold-500/30 transition-all text-sm"
              >
                Fazer Orçamento
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </a>
          </motion.div>

          {/* Quick stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="flex items-center justify-center gap-8 mt-12 text-xs text-graphite-500"
          >
            {[
              { icon: Scissors, label: "Corte Die-Cut" },
              { icon: Shield, label: "Vinil Premium" },
              { icon: Truck, label: "Frete Grátis Brasil" },
            ].map(({ icon: Icon, label }) => (
              <span key={label} className="flex items-center gap-1.5">
                <Icon className="w-3 h-3 text-gold-600/50" />
                {label}
              </span>
            ))}
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-graphite-600"
        >
          <ChevronDown className="w-5 h-5" />
        </motion.div>
      </section>

      {/* ── FEATURES STRIP ────────────────────────────────── */}
      <section className="py-16 border-t border-graphite-800/50">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center group"
            >
              <div className="w-12 h-12 rounded-xl bg-gold-500/5 border border-gold-500/10 flex items-center justify-center mx-auto mb-3 group-hover:border-gold-500/20 group-hover:bg-gold-500/10 transition-all duration-500">
                <f.icon className="w-5 h-5 text-gold-400" />
              </div>
              <h3 className="font-semibold text-sm text-white mb-1">
                {f.title}
              </h3>
              <p className="text-xs text-graphite-500">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── VITRINE / GALLERY ─────────────────────────────── */}
      <section id="vitrine" className="py-20 border-t border-graphite-800/50">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <Badge className="mb-4 px-3 py-1 gap-1.5 border-gold-500/20 bg-gold-500/5 text-gold-400 font-medium">
              <Gem className="w-3 h-3" />
              Vitrine Premium
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-gradient-gold mb-3 font-display">
              Coleção em Destaque
            </h2>
            <p className="text-graphite-500 text-sm max-w-xl mx-auto">
              Explore nossa curadoria de designs exclusivos. Clique em qualquer
              peça para selecioná-la e configurar seu pedido.
            </p>
          </motion.div>

          {/* Category Filters */}
          <div className="flex items-center justify-center gap-2 flex-wrap mb-10">
            <button
              onClick={() => setActiveCategoria("all")}
              className={cn(
                "px-5 py-2 rounded-full text-xs font-semibold transition-all duration-300",
                activeCategoria === "all"
                  ? "bg-gold-600 text-graphite-900 shadow-lg shadow-gold-600/15"
                  : "bg-graphite-800 text-graphite-400 hover:text-white border border-graphite-700 hover:border-graphite-600"
              )}
            >
              Todos
            </button>
            {categorias.map((cat) => (
              <button
                key={cat.slug}
                onClick={() => setActiveCategoria(cat.slug)}
                className={cn(
                  "px-5 py-2 rounded-full text-xs font-semibold transition-all duration-300",
                  activeCategoria === cat.slug
                    ? "bg-gold-600 text-graphite-900 shadow-lg shadow-gold-600/15"
                    : "bg-graphite-800 text-graphite-400 hover:text-white border border-graphite-700 hover:border-graphite-600"
                )}
              >
                {cat.nome}
              </button>
            ))}
          </div>

          {/* Gallery Grid */}
          {filteredFigs.length === 0 ? (
            <div className="text-center py-16 text-graphite-600">
              <Gem className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>Nenhum modelo encontrado nesta categoria.</p>
            </div>
          ) : (
            <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
              {filteredFigs.map((fig, i) => (
                <GalleryCard
                  key={fig.id}
                  figurinha={fig}
                  index={i}
                  isSelected={selectedFig?.id === fig.id}
                  onSelect={handleSelectFig}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── ORDER CONFIGURATOR ────────────────────────────── */}
      <section
        id="configurador"
        className="py-20 border-t border-graphite-800/50"
      >
        <div className="max-w-2xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8"
          >
            <Badge className="mb-4 px-3 py-1 gap-1.5 border-gold-500/20 bg-gold-500/5 text-gold-400 font-medium">
              <Wand2 className="w-3 h-3" />
              Configurador de Pedido
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-gradient-gold mb-3 font-display">
              Monte Seu Adesivo
            </h2>
            <p className="text-graphite-500 text-sm">
              {selectedFig
                ? `Modelo "${selectedFig.titulo}" selecionado. Configure abaixo.`
                : "Escolha um modelo na vitrine ou faça upload da sua arte."}
            </p>
          </motion.div>

          <OrderConfigurator selectedFigurinha={selectedFig} />
        </div>
      </section>

      {/* ── TESTIMONIALS ──────────────────────────────────── */}
      <section className="py-20 border-t border-graphite-800/50">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <Badge className="mb-4 px-3 py-1 border-gold-500/20 bg-gold-500/5 text-gold-400 font-medium">
              <Star className="w-3 h-3 fill-gold-400" />
              Prova Social
            </Badge>
            <h2 className="text-3xl font-bold text-gradient mb-2 font-display">
              Clientes Satisfeitos
            </h2>
            <p className="text-graphite-500 text-sm">
              O que dizem sobre nossos adesivos premium
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="glass rounded-2xl p-6 h-full hover:border-gold-500/10 transition-all duration-500">
                  <div className="flex items-center gap-1 mb-4 text-gold-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-current" />
                    ))}
                  </div>
                  <p className="text-sm text-graphite-400 leading-relaxed mb-4">
                    &ldquo;{t.text}&rdquo;
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-graphite-900 font-bold text-xs">
                      {t.initials}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">
                        {t.name}
                      </p>
                      <p className="text-xs text-graphite-500">{t.detail}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────── */}
      <footer className="border-t border-graphite-800/50 py-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2.5 mb-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-graphite-900 font-extrabold text-sm shadow-lg shadow-gold-500/20">
              FS
            </div>
            <span className="font-bold text-white text-lg font-display">
              Figurinhas<span className="text-gold-400">.</span>
            </span>
          </div>
          <p className="text-sm text-graphite-500 mb-6">
            Adesivos premium personalizados. Qualidade, design e sofisticação.
          </p>
          <div className="flex items-center justify-center gap-6 text-xs text-graphite-600">
            <a href="#vitrine" className="hover:text-gold-400 transition-colors">
              Vitrine
            </a>
            <a
              href="#configurador"
              className="hover:text-gold-400 transition-colors"
            >
              Configurador
            </a>
            <a
              href="/admin/login"
              className="hover:text-gold-400 transition-colors"
            >
              Admin
            </a>
          </div>
          <p className="text-xs text-graphite-700 mt-6">
            © {new Date().getFullYear()} Figurinhas Premium. Todos os direitos
            reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
