"use client";

import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import { motion, useScroll, useTransform, useMotionValue, useSpring } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, formatPrice } from "@/lib/utils";

const Helmet3D = dynamic(() => import("@/components/Helmet3D"), { ssr: false });
import {
  MessageCircle,
  Sparkles,
  Shield,
  Palette,
  Truck,
  Star,
  ChevronDown,
  Upload,
  Send,
  Zap,
  Clock,
  ShoppingBag,
  ArrowRight,
  Menu,
  X,
} from "lucide-react";

// ── Types ───────────────────────────────────────────────────
interface Figurinha {
  id: number;
  titulo: string;
  descricao: string;
  url_imagem: string;
  categoria_nome: string;
  categoria_slug: string;
  preco: number | null;
}

interface Categoria {
  id: number;
  nome: string;
  slug: string;
}

// ── Constants ───────────────────────────────────────────────

const FINISH_TYPES = ["Brilhante", "Fosco", "Refletivo", "Holográfico"];
const URGENCY_OPTIONS = [
  { value: "", label: "Sem pressa / Normal" },
  { value: "Esta semana", label: "Esta semana" },
  { value: "Urgente - 3 dias", label: "Urgente - 3 dias" },
  { value: "Urgentíssimo - 24h", label: "Urgentíssimo - 24h" },
];

const TESTIMONIALS = [
  {
    initials: "RL",
    name: "Ricardo L.",
    detail: "Capacete LS2 + Moto Hornet",
    text: "As figurinhas ficaram insanas no capacete! O acabamento refletivo deu um toque premium e a entrega foi super rápida.",
    gradient: "from-brand-500 to-purple-600",
  },
  {
    initials: "MA",
    name: "Marcos A.",
    detail: "Turma do Grau ZN",
    text: "Pedimos o combo de figurinhas para 3 capacetes iguais. Ficou perfeito! O pessoal do rolê todo elogiou demais.",
    gradient: "from-emerald-500 to-teal-600",
  },
  {
    initials: "JF",
    name: "Juliana F.",
    detail: "Notebook + Capa de Celular",
    text: "Mandei minha própria arte e eles reproduziram exatamente como eu queria. Qualidade absurda, já vou pedir mais!",
    gradient: "from-blue-500 to-indigo-600",
  },
];

// ── 3D Hero Scene ──────────────────────────────────────────
function HeroScene() {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 600], [0, 150]);
  const opacity = useTransform(scrollY, [0, 400], [1, 0.3]);
  const scale = useTransform(scrollY, [0, 600], [1, 0.9]);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 50, damping: 30 });
  const springY = useSpring(mouseY, { stiffness: 50, damping: 30 });
  const rotateX = useTransform(springY, [-0.5, 0.5], [8, -8]);
  const rotateY = useTransform(springX, [-0.5, 0.5], [-8, 8]);

  function handleMouseMove(e: React.MouseEvent) {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  }

  return (
    <motion.div
      style={{ y, opacity, scale }}
      onMouseMove={handleMouseMove}
      className="relative w-full h-screen max-h-[900px] min-h-[600px] overflow-hidden"
    >
      {/* 3D Helmet */}
      <motion.div
        style={{ rotateX, rotateY }}
        className="absolute inset-0 z-10"
      >
        <Helmet3D className="w-full h-full" />
      </motion.div>

      {/* Gradient overlays */}
      <div className="absolute inset-0 z-20 pointer-events-none bg-gradient-to-b from-background/30 via-transparent to-background" />
      <div className="absolute inset-0 z-20 pointer-events-none bg-gradient-to-r from-background via-transparent to-background" />

      {/* Floating badge */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.8 }}
        className="absolute top-8 left-1/2 -translate-x-1/2 z-30"
      >
        <Badge variant="secondary" className="px-4 py-2 text-sm gap-2 border-primary/30 bg-primary/10 backdrop-blur-xl">
          <Sparkles className="w-4 h-4 text-primary" />
          <span>Visualize em 3D — Mova o mouse!</span>
        </Badge>
      </motion.div>

      {/* Hero text */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.8 }}
        className="absolute bottom-10 sm:bottom-16 left-0 right-0 z-30 text-center px-4"
      >
        <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight text-white mb-4">
          Suas figurinhas{" "}
          <span className="text-gradient">do seu jeito</span>
        </h1>
        <p className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto mb-8">
          Adesivos premium para capacetes, motos e notebooks. Escolha um modelo
          ou envie sua arte e receba o orçamento via WhatsApp em segundos.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            size="lg"
            variant="glow"
            onClick={() =>
              document
                .getElementById("gallery")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            <ShoppingBag className="w-5 h-5 mr-2" />
            Ver Galeria
          </Button>
          <Button
            size="lg"
            variant="white"
            onClick={() =>
              document
                .getElementById("quote")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            <Upload className="w-5 h-5 mr-2" />
            Enviar Minha Arte
          </Button>
        </div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 text-muted-foreground"
      >
        <ChevronDown className="w-6 h-6" />
      </motion.div>
    </motion.div>
  );
}

// ── Features Strip ──────────────────────────────────────────
function FeaturesStrip() {
  const features = [
    { icon: Palette, title: "Acabamento Premium", desc: "Brilhante, Fosco, Refletivo e Holográfico" },
    { icon: Shield, title: "Alta Durabilidade", desc: "Vinil resistente a sol e chuva" },
    { icon: Zap, title: "Entrega Rápida", desc: "Produção e envio agilizado" },
    { icon: Truck, title: "Envio para Todo Brasil", desc: "Com código de rastreio" },
  ];

  return (
    <section className="relative z-40 -mt-10 pb-20">
      <div className="max-w-6xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-4">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
          >
            <Card className="glass border-white/5 text-center h-full">
              <CardContent className="pt-6">
                <f.icon className="w-8 h-8 text-primary mx-auto mb-3" />
                <h3 className="font-semibold text-sm mb-1">{f.title}</h3>
                <p className="text-muted-foreground text-xs">{f.desc}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// ── Gallery Section ─────────────────────────────────────────
function GallerySection({
  figurinhas,
  categorias,
  activeCategoria,
  setActiveCategoria,
  onSelectModel,
}: {
  figurinhas: Figurinha[];
  categorias: Categoria[];
  activeCategoria: string;
  setActiveCategoria: (s: string) => void;
  onSelectModel: (f: Figurinha) => void;
}) {
  const filtered =
    activeCategoria === "all"
      ? figurinhas
      : figurinhas.filter((f) => f.categoria_slug === activeCategoria);

  return (
    <section id="gallery" className="relative z-40 py-20">
      <div className="max-w-7xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <Badge variant="secondary" className="mb-4">
            Galeria de Inspiração
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold mb-3">
            Modelos em Destaque
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Clique em um modelo para solicitar orçamento ou use-o como inspiração
          </p>
        </motion.div>

        {/* Category filters */}
        <div className="flex items-center justify-center gap-2 flex-wrap mb-10">
          <button
            onClick={() => setActiveCategoria("all")}
            className={cn(
              "px-4 py-2 rounded-full text-xs font-semibold transition-all active:scale-95",
              activeCategoria === "all"
                ? "bg-primary text-white"
                : "bg-secondary text-muted-foreground hover:text-white hover:bg-secondary/80"
            )}
          >
            Todos
          </button>
          {categorias.map((cat) => (
            <button
              key={cat.slug}
              onClick={() => setActiveCategoria(cat.slug)}
              className={cn(
                "px-4 py-2 rounded-full text-xs font-semibold transition-all active:scale-95",
                activeCategoria === cat.slug
                  ? "bg-primary text-white"
                  : "bg-secondary text-muted-foreground hover:text-white hover:bg-secondary/80"
              )}
            >
              {cat.nome}
            </button>
          ))}
        </div>

        {/* Gallery grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg">Nenhum modelo encontrado.</p>
            <p className="text-sm">Cadastre figurinhas pelo painel admin.</p>
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
            {filtered.map((fig, i) => (
              <motion.div
                key={fig.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05, duration: 0.4 }}
                className="break-inside-avoid"
              >
                <Card className="glass border-white/5 overflow-hidden group cursor-pointer hover:border-primary/30 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5"
                      onClick={() => onSelectModel(fig)}>
                  <div className="aspect-[4/3] bg-secondary overflow-hidden">
                    {fig.url_imagem ? (
                      <img
                        src={`http://127.0.0.1:5000/static/${fig.url_imagem}`}
                        alt={fig.titulo}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                        Sem imagem
                      </div>
                    )}
                  </div>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold text-sm truncate">
                        {fig.titulo}
                      </h3>
                      {fig.categoria_nome && (
                        <span className="flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium bg-secondary text-muted-foreground border border-white/5">
                          {fig.categoria_nome}
                        </span>
                      )}
                    </div>
                    {fig.descricao && (
                      <p className="text-muted-foreground text-xs mb-3 line-clamp-2">
                        {fig.descricao}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      {fig.preco ? (
                        <Badge variant="success">
                          {formatPrice(fig.preco)}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Valor a Consultar</Badge>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-primary hover:text-primary"
                      >
                        <MessageCircle className="w-3.5 h-3.5 mr-1" />
                        Orçar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// ── Quote Form Section ──────────────────────────────────────
function QuoteSection({ figurinhaRef }: { figurinhaRef: Figurinha | null }) {
  const [files, setFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const [whatsapp, setWhatsapp] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function handleWhatsAppMask(value: string) {
    let v = value.replace(/\D/g, "").slice(0, 11);
    if (v.length > 0) v = v.replace(/^(\d{2})(\d)/, "($1) $2");
    if (v.length > 0) v = v.replace(/(\d{5})(\d)/, "$1-$2");
    setWhatsapp(v);
  }

  function handleFiles(newFiles: FileList | null) {
    if (!newFiles) return;
    const arr = Array.from(newFiles).slice(0, 5);
    setFiles((prev) => [...prev, ...arr].slice(0, 5));
  }

  function removeFile(i: number) {
    setFiles((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    const form = new FormData(e.target as HTMLFormElement);
    files.forEach((f) => form.append("artworks", f));

    try {
      const res = await fetch("/api/pedidos", { method: "POST", body: form });
      const data = await res.json();
      if (data.success) {
        window.open(data.whatsapp_link, "_blank");
        (e.target as HTMLFormElement).reset();
        setFiles([]);
        setWhatsapp("");
      } else {
        alert(data.errors?.join("\n") || "Erro ao enviar.");
      }
    } catch {
      alert("Erro de conexão.");
    } finally {
      setSending(false);
    }
  }

  return (
    <section id="quote" className="relative z-40 py-20">
      <div className="max-w-2xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <Badge variant="success" className="mb-4 gap-1.5">
            <Zap className="w-3 h-3" />
            Orçamento Rápido
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold mb-3">
            Solicitar Orçamento
          </h2>
          <p className="text-muted-foreground">
            Preencha os dados e receba o orçamento via WhatsApp
          </p>
        </motion.div>

        <Card className="glass-strong border-white/10 p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <input
              type="hidden"
              name="referencia_figurinha_id"
              value={figurinhaRef?.id || ""}
            />

            {figurinhaRef && (
              <div className="flex items-center gap-3 p-3 bg-secondary rounded-xl">
                <div className="w-12 h-12 bg-background rounded-lg overflow-hidden flex-shrink-0">
                  {figurinhaRef.url_imagem && (
                    <img
                      src={`http://127.0.0.1:5000/static/${figurinhaRef.url_imagem}`}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">{figurinhaRef.titulo}</p>
                  <p className="text-xs text-muted-foreground">
                    Modelo de referência
                  </p>
                </div>
              </div>
            )}

            {/* Multi-file upload */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Suas Artes <span className="text-muted-foreground">(até 5)</span>
              </label>
              <div
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-white/10 rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 transition-colors bg-secondary/50"
              >
                <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Arraste ou clique para enviar
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  PNG, JPG, PDF, SVG — máx 16MB cada
                </p>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".png,.jpg,.jpeg,.pdf,.svg,.webp"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFiles(e.target.files)}
                />
              </div>
              {files.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {files.map((f, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-secondary rounded-lg text-xs"
                    >
                      {f.name}
                      <button
                        type="button"
                        onClick={() => removeFile(i)}
                        className="text-red-400 hover:text-red-300"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Name + WhatsApp */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Nome *
                </label>
                <input
                  name="cliente_nome"
                  required
                  className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                  placeholder="Seu nome completo"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  WhatsApp *
                </label>
                <input
                  name="cliente_whatsapp"
                  required
                  value={whatsapp}
                  onChange={(e) => handleWhatsAppMask(e.target.value)}
                  maxLength={15}
                  className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>

            {/* Qty + Size + Finish */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Quantidade *
                </label>
                <input
                  type="number"
                  name="quantidade"
                  required
                  min={1}
                  className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                  placeholder="Ex: 50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Tamanho
                </label>
                <input
                  name="tamanho_estimado"
                  className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                  placeholder="Ex: 5x5 cm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Acabamento *
                </label>
                <select
                  name="tipo_acabamento"
                  required
                  className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                >
                  <option value="">Selecione...</option>
                  {FINISH_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Urgency + Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  <Clock className="w-3.5 h-3.5 inline mr-1" />
                  Para quando?
                </label>
                <select
                  name="urgencia"
                  className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                >
                  {URGENCY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Observações
                </label>
                <textarea
                  name="observacoes"
                  rows={2}
                  className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary resize-none"
                  placeholder="Detalhes adicionais..."
                />
              </div>
            </div>

            <Button
              type="submit"
              size="xl"
              variant="glow"
              className="w-full"
              disabled={sending}
            >
              {sending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white mr-2" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  Enviar Pedido via WhatsApp
                </>
              )}
            </Button>
          </form>
        </Card>
      </div>
    </section>
  );
}

// ── Testimonials Section ────────────────────────────────────
function TestimonialsSection() {
  return (
    <section className="relative z-40 py-20">
      <div className="max-w-6xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <Badge variant="secondary" className="mb-4">
            Quem Usa Recomenda
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold">
            Clientes Satisfeitos
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="glass border-white/5 h-full hover:border-white/10 transition-all">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-1 mb-4 text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    &ldquo;{t.text}&rdquo;
                  </p>
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.gradient} flex items-center justify-center text-white font-bold text-sm`}
                    >
                      {t.initials}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{t.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.detail}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Footer ──────────────────────────────────────────────────
function SiteFooter() {
  return (
    <footer className="relative z-40 border-t border-white/5 py-12">
      <div className="max-w-6xl mx-auto px-4 text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white font-extrabold text-sm shadow-lg shadow-primary/20">
            FS
          </div>
          <span className="font-bold text-lg">
            Figurinhas<span className="text-primary">.</span>
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Figurinhas Adesivas. Todos os
          direitos reservados.
        </p>
      </div>
    </footer>
  );
}

// ── Main Page ───────────────────────────────────────────────
export default function Home() {
  const [figurinhas, setFigurinhas] = useState<Figurinha[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [activeCategoria, setActiveCategoria] = useState("all");
  const [selectedFig, setSelectedFig] = useState<Figurinha | null>(null);
  const [mobileMenu, setMobileMenu] = useState(false);

  useEffect(() => {
    fetch("/api/figurinhas")
      .then((r) => r.json())
      .then(setFigurinhas)
      .catch(() => {});

    // Fetch categories from the vitrine data
    fetch("/api/figurinhas")
      .then((r) => r.json())
      .then((figs: Figurinha[]) => {
        const cats = new Map<string, Categoria>();
        figs.forEach((f) => {
          if (f.categoria_slug && !cats.has(f.categoria_slug)) {
            cats.set(f.categoria_slug, {
              id: cats.size + 1,
              nome: f.categoria_nome,
              slug: f.categoria_slug,
            });
          }
        });
        setCategorias(Array.from(cats.values()));
      })
      .catch(() => {});
  }, []);

  function handleSelectModel(fig: Figurinha) {
    setSelectedFig(fig);
    setTimeout(() => {
      document
        .getElementById("quote")
        ?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <a href="#" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white font-extrabold text-sm shadow-lg shadow-primary/20">
              FS
            </div>
            <span className="font-bold text-lg hidden sm:inline">
              Figurinhas<span className="text-primary">.</span>
            </span>
          </a>

          {/* Desktop nav */}
          <div className="hidden sm:flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                document
                  .getElementById("gallery")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Galeria
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                document
                  .getElementById("quote")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Orçamento
            </Button>
            <a href="/admin/dashboard" target="_blank">
              <Button variant="ghost" size="sm">
                Admin
              </Button>
            </a>
            <Button
              size="sm"
              variant="glow"
              onClick={() =>
                document
                  .getElementById("quote")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              <Send className="w-3.5 h-3.5 mr-1" />
              Solicitar Orçamento
            </Button>
          </div>

          {/* Mobile menu toggle */}
          <button
            className="sm:hidden p-2"
            onClick={() => setMobileMenu(!mobileMenu)}
          >
            {mobileMenu ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenu && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="sm:hidden glass border-t border-white/5 px-4 py-4 space-y-2"
          >
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => setMobileMenu(false)}
            >
              Galeria
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => setMobileMenu(false)}
            >
              Orçamento
            </Button>
            <a href="/admin/dashboard" target="_blank">
              <Button variant="ghost" className="w-full justify-start">
                Admin
              </Button>
            </a>
          </motion.div>
        )}
      </nav>

      {/* Sections */}
      <HeroScene />
      <FeaturesStrip />
      <GallerySection
        figurinhas={figurinhas}
        categorias={categorias}
        activeCategoria={activeCategoria}
        setActiveCategoria={setActiveCategoria}
        onSelectModel={handleSelectModel}
      />
      <QuoteSection figurinhaRef={selectedFig} />
      <TestimonialsSection />
      <SiteFooter />
    </div>
  );
}
