"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { motion, useScroll, useTransform } from "framer-motion";
import { cn, formatPrice } from "@/lib/utils";
import { Spotlight, SpotlightBorder } from "@/components/Spotlight";
import QuoteForm from "@/components/QuoteForm";
import UploadPanel from "@/components/UploadPanel";
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
  ShoppingBag,
  Upload,
  ArrowRight,
} from "lucide-react";

// Dynamic import — zero SSR for 3D
const Simulador3D = dynamic(() => import("@/components/Simulador3D"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[500px] flex items-center justify-center bg-black rounded-2xl border border-zinc-800/50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-2 border-pink-500/20 border-t-pink-500 animate-spin" />
        <p className="text-xs text-zinc-600">Carregando simulador...</p>
      </div>
    </div>
  ),
});

// ── Types ──────────────────────────────────────────────────
interface Figurinha {
  id: number;
  titulo: string;
  descricao: string;
  url_imagem: string;
  categoria_nome: string;
  categoria_slug: string;
  preco: number | null;
}

type HelmetColor = "white" | "black";

// ── Features ───────────────────────────────────────────────
const FEATURES = [
  { icon: Palette, title: "Acabamento Premium", desc: "Brilhante, Fosco, Refletivo, Holográfico" },
  { icon: Shield, title: "Alta Durabilidade", desc: "Vinil resistente a sol, chuva e lavagem" },
  { icon: Truck, title: "Envio para Todo Brasil", desc: "Rastreio grátis em todos os pedidos" },
  { icon: Zap, title: "Produção Ágil", desc: "Seu pedido produzido em até 48h úteis" },
];

const TESTIMONIALS = [
  { initials: "RL", name: "Ricardo L.", detail: "Capacete LS2 Hornet", text: "As figurinhas ficaram insanas! Acabamento refletivo premium, entrega rápida. O simulador 3D ajudou demais a escolher." },
  { initials: "MA", name: "Marcos A.", detail: "Grau ZN Crew", text: "Pedimos combo pra 3 capacetes. Ficou perfeito, geral elogiou no rolê. Qualidade absurda!" },
  { initials: "JF", name: "Juliana F.", detail: "Notebook + Celular", text: "Mandei minha arte, vi no simulador como ficava e aprovei. Ficou exatamente igual. Já vou pedir mais!" },
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
          ? "glass border-b border-zinc-800/50 py-3"
          : "bg-transparent py-4"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
        <a href="#" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center text-white font-extrabold text-xs shadow-lg shadow-pink-500/20">
            FS
          </div>
          <span className="font-bold text-white hidden sm:inline">
            Figurinhas<span className="text-pink-500">.</span>
          </span>
        </a>

        <div className="flex items-center gap-2">
          <a href="#simulator">
            <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
              Simulador
            </Button>
          </a>
          <a href="#gallery">
            <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
              Galeria
            </Button>
          </a>
          <a href="/admin/login" target="_blank">
            <Button variant="ghost" size="sm" className="text-zinc-500 hover:text-zinc-300 text-xs">
              Admin
            </Button>
          </a>
          <a href="#quote">
            <Button size="sm" className="bg-pink-600 hover:bg-pink-500 text-white rounded-full px-5 shadow-lg shadow-pink-600/20">
              <Upload className="w-3.5 h-3.5 mr-1.5" />
              Upload
            </Button>
          </a>
        </div>
      </div>
    </nav>
  );
}

// ── Main Page ──────────────────────────────────────────────
export default function Home() {
  const [textureUrl, setTextureUrl] = useState<string | null>(null);
  const [helmetColor, setHelmetColor] = useState<HelmetColor>("black");
  const [decalScale, setDecalScale] = useState(1.0);
  const [decalPosition, setDecalPosition] = useState<"front" | "top" | "left" | "right" | "back">("front");
  const [finishType, setFinishType] = useState<"Brilhante" | "Fosco" | "Refletivo" | "Holográfico">("Brilhante");
  const [figurinhas, setFigurinhas] = useState<Figurinha[]>([]);
  const [activeCategoria, setActiveCategoria] = useState("all");
  const [categorias, setCategorias] = useState<{ nome: string; slug: string }[]>([]);
  const [refFigurinhaId, setRefFigurinhaId] = useState<number | null>(null);

  // Fetch figurinhas from API
  useEffect(() => {
    fetch("/api/figurinhas")
      .then((r) => r.json())
      .then((data: Figurinha[]) => {
        setFigurinhas(data);
        const cats = new Map<string, { nome: string; slug: string }>();
        data.forEach((f) => {
          if (f.categoria_slug && !cats.has(f.categoria_slug)) {
            cats.set(f.categoria_slug, { nome: f.categoria_nome, slug: f.categoria_slug });
          }
        });
        setCategorias(Array.from(cats.values()));
      })
      .catch(() => {});
  }, []);

  // Handle gallery card click → inject into 3D simulator
  function handleGalleryClick(fig: Figurinha) {
    setRefFigurinhaId(fig.id);
    if (fig.url_imagem) {
      setTextureUrl(`http://127.0.0.1:5000/static/${fig.url_imagem}`);
    }
    // Scroll to simulator
    document.getElementById("simulator")?.scrollIntoView({ behavior: "smooth" });
  }

  // Handle texture upload from quote form
  function handleTextureUpload(url: string) {
    setTextureUrl(url);
    setRefFigurinhaId(null);
  }

  const filteredFigs =
    activeCategoria === "all"
      ? figurinhas
      : figurinhas.filter((f) => f.categoria_slug === activeCategoria);

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      <Navbar />

      {/* ── HERO + SIMULATOR ─────────────────────────────── */}
      <section
        id="simulator"
        className="relative min-h-screen flex items-center pt-24 pb-12"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(236,72,153,0.12),transparent)]" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-10 items-start">
            {/* LEFT — 3D Viewer (3/5 width) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="lg:col-span-3 order-2 lg:order-1"
            >
              <SpotlightBorder className="w-full">
                <div className="rounded-2xl overflow-hidden bg-[#050508] min-h-[450px] lg:min-h-[580px]">
                  <Simulador3D
                    textureUrl={textureUrl}
                    helmetColor={helmetColor}
                    decalScale={decalScale}
                    decalPosition={decalPosition}
                    finishType={finishType}
                    onDecalPositionChange={setDecalPosition}
                    className="w-full h-full"
                  />
                </div>
              </SpotlightBorder>
            </motion.div>

            {/* RIGHT — Upload Panel (2/5 width) */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, ease: "easeOut", delay: 0.15 }}
              className="lg:col-span-2 order-1 lg:order-2"
            >
              {/* Title */}
              <div className="mb-5">
                <Badge className="mb-3 px-3 py-1 text-xs gap-1.5 border-pink-500/30 bg-pink-500/5 text-pink-300">
                  <Sparkles className="w-3 h-3" />
                  Simulador 3D
                </Badge>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight mb-2">
                  Visualize suas{" "}
                  <span className="text-gradient-pink">figurinhas</span>
                </h1>
                <p className="text-zinc-500 text-sm leading-relaxed">
                  Faça upload da sua arte e veja em <span className="text-zinc-300">tempo real</span> no capacete ou na capinha.
                </p>
              </div>

              {/* Upload + Config Panel */}
              <UploadPanel
                textureUrl={textureUrl}
                helmetColor={helmetColor}
                decalScale={decalScale}
                decalPosition={decalPosition}
                finishType={finishType}
                onColorChange={setHelmetColor}
                onTextureUpload={handleTextureUpload}
                onScaleChange={setDecalScale}
                onDecalPositionChange={setDecalPosition}
                onFinishChange={setFinishType}
              />

              {/* Quick stats */}
              <div className="flex items-center gap-5 mt-5 text-[10px] text-zinc-600">
                {["+500 clientes", "Produção 48h", "Frete Grátis"].map((s) => (
                  <span key={s} className="flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-pink-500/40" />
                    {s}
                  </span>
                ))}
                <a href="#gallery" className="text-pink-500 hover:text-pink-400 ml-auto flex items-center gap-1">
                  Galeria <ArrowRight className="w-3 h-3" />
                </a>
              </div>
            </motion.div>
          </div>
        </div>

        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 text-zinc-600"
        >
          <ChevronDown className="w-5 h-5" />
        </motion.div>
      </section>

      {/* ── FEATURES STRIP ────────────────────────────────── */}
      <section className="py-16 border-t border-zinc-900">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <div className="w-10 h-10 rounded-xl bg-pink-500/5 border border-pink-500/10 flex items-center justify-center mx-auto mb-3">
                <f.icon className="w-5 h-5 text-pink-400" />
              </div>
              <h3 className="font-semibold text-sm text-white mb-1">{f.title}</h3>
              <p className="text-xs text-zinc-500">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── QUOTE FORM SECTION ────────────────────────────── */}
      <section id="quote" className="py-20 border-t border-zinc-900">
        <div className="max-w-2xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8"
          >
            <Badge variant="secondary" className="mb-4 gap-1.5">
              <Zap className="w-3 h-3" />
              Monte seu Orçamento
            </Badge>
            <h2 className="text-3xl font-bold text-gradient mb-2">
              Pronto para pedir?
            </h2>
            <p className="text-zinc-500 text-sm">
              {textureUrl
                ? "Sua arte está no simulador 3D. Agora é só preencher os detalhes."
                : "Faça upload da sua imagem e veja no simulador ao lado."}
            </p>
          </motion.div>

          <QuoteForm
            referenciaFigurinhaId={refFigurinhaId}
            onTextureUpload={handleTextureUpload}
          />
        </div>
      </section>

      {/* ── GALLERY ───────────────────────────────────────── */}
      <section id="gallery" className="py-20 border-t border-zinc-900">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <Badge variant="secondary" className="mb-4">Galeria de Inspiração</Badge>
            <h2 className="text-3xl font-bold text-gradient mb-2">Modelos em Destaque</h2>
            <p className="text-zinc-500 text-sm">
              Clique em qualquer modelo para testar no simulador 3D
            </p>
          </motion.div>

          {/* Filters */}
          <div className="flex items-center justify-center gap-2 flex-wrap mb-10">
            <button
              onClick={() => setActiveCategoria("all")}
              className={cn(
                "px-4 py-2 rounded-full text-xs font-semibold transition-all",
                activeCategoria === "all"
                  ? "bg-pink-600 text-white"
                  : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800"
              )}
            >
              Todos
            </button>
            {categorias.map((cat) => (
              <button
                key={cat.slug}
                onClick={() => setActiveCategoria(cat.slug)}
                className={cn(
                  "px-4 py-2 rounded-full text-xs font-semibold transition-all",
                  activeCategoria === cat.slug
                    ? "bg-pink-600 text-white"
                    : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800"
                )}
              >
                {cat.nome}
              </button>
            ))}
          </div>

          {/* Cards */}
          {filteredFigs.length === 0 ? (
            <div className="text-center py-16 text-zinc-600">
              <p>Nenhum modelo encontrado.</p>
            </div>
          ) : (
            <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
              {filteredFigs.map((fig, i) => (
                <motion.div
                  key={fig.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ delay: i * 0.04, duration: 0.5 }}
                  className="break-inside-avoid cursor-pointer"
                  onClick={() => handleGalleryClick(fig)}
                >
                  <Spotlight className="rounded-2xl" color="rgba(236,72,153,0.06)">
                    <div className="glass rounded-2xl overflow-hidden group hover:border-pink-500/30 transition-all duration-500">
                      <div className="aspect-[4/3] bg-zinc-900 overflow-hidden">
                        {fig.url_imagem ? (
                          <img
                            src={`http://127.0.0.1:5000/static/${fig.url_imagem}`}
                            alt={fig.titulo}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-zinc-700 text-sm">
                            Sem imagem
                          </div>
                        )}
                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                          <span className="text-white text-xs font-medium flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-pink-400" />
                            Testar no Simulador 3D
                          </span>
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="font-semibold text-sm text-white truncate">
                            {fig.titulo}
                          </h3>
                          {fig.categoria_nome && (
                            <span className="flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] bg-zinc-800 text-zinc-400 border border-zinc-700/50">
                              {fig.categoria_nome}
                            </span>
                          )}
                        </div>
                        {fig.descricao && (
                          <p className="text-xs text-zinc-500 mb-3 line-clamp-2">
                            {fig.descricao}
                          </p>
                        )}
                        {fig.preco ? (
                          <Badge variant="success" className="text-xs">
                            {formatPrice(fig.preco)}
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            Valor a Consultar
                          </Badge>
                        )}
                      </div>
                    </div>
                  </Spotlight>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── TESTIMONIALS ──────────────────────────────────── */}
      <section className="py-20 border-t border-zinc-900">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <Badge variant="secondary" className="mb-4">Prova Social</Badge>
            <h2 className="text-3xl font-bold text-gradient">Clientes Satisfeitos</h2>
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
                <Spotlight className="rounded-2xl" color="rgba(236,72,153,0.04)">
                  <div className="glass rounded-2xl p-6 h-full">
                    <div className="flex items-center gap-1 mb-4 text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-current" />
                      ))}
                    </div>
                    <p className="text-sm text-zinc-400 leading-relaxed mb-4">
                      &ldquo;{t.text}&rdquo;
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs">
                        {t.initials}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{t.name}</p>
                        <p className="text-xs text-zinc-500">{t.detail}</p>
                      </div>
                    </div>
                  </div>
                </Spotlight>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────── */}
      <footer className="border-t border-zinc-900 py-10">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center text-white font-extrabold text-xs shadow-lg shadow-pink-500/20">
              FS
            </div>
            <span className="font-bold text-white">
              Figurinhas<span className="text-pink-500">.</span>
            </span>
          </div>
          <p className="text-xs text-zinc-600">
            © {new Date().getFullYear()} Figurinhas Adesivas. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
