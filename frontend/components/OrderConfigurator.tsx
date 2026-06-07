"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import LuxuryStepper from "@/components/LuxuryStepper";
import {
  Upload,
  X,
  Send,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  Image,
  ShoppingBag,
  Minus,
  Plus,
} from "lucide-react";

interface Figurinha {
  id: number;
  titulo: string;
  descricao: string;
  url_imagem: string;
  categoria_nome: string;
  categoria_slug: string;
  preco: number | null;
}

const STEPS = [
  { label: "Origem da Arte", description: "Vitrine ou upload" },
  { label: "Acabamento", description: "Escolha o efeito" },
  { label: "Dimensões", description: "Tamanho e contato" },
];

const FINISHES = [
  {
    value: "Brilhante",
    icon: "✨",
    label: "Brilhante",
    desc: "Alto brilho, cores vibrantes e intensas",
  },
  {
    value: "Fosco Acetinado",
    icon: "🌫️",
    label: "Fosco Acetinado",
    desc: "Elegância discreta sem reflexo",
  },
  {
    value: "Refletivo Premium",
    icon: "💎",
    label: "Refletivo Premium",
    desc: "Retroreflexivo, destaque à noite",
  },
  {
    value: "Holográfico Luxo",
    icon: "🌈",
    label: "Holográfico Luxo",
    desc: "Efeito arco-íris multidimensional",
  },
];

interface OrderConfiguratorProps {
  selectedFigurinha: Figurinha | null;
  className?: string;
}

export default function OrderConfigurator({
  selectedFigurinha,
  className,
}: OrderConfiguratorProps) {
  const [step, setStep] = useState(0);

  // Step 1 state
  const [artSource, setArtSource] = useState<"vitrine" | "upload">(
    selectedFigurinha ? "vitrine" : "upload"
  );
  const [files, setFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Step 2 state
  const [finish, setFinish] = useState("");

  // Step 3 state
  const [largura, setLargura] = useState("");
  const [altura, setAltura] = useState("");
  const [quantidade, setQuantidade] = useState(1);
  const [whatsapp, setWhatsapp] = useState("");
  const [nome, setNome] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  // File handlers
  function handleFiles(newFiles: FileList | null) {
    if (!newFiles) return;
    const arr = Array.from(newFiles).slice(0, 5);
    setFiles((prev) => [...prev, ...arr].slice(0, 5));
  }

  function removeFile(i: number) {
    setFiles((prev) => prev.filter((_, idx) => idx !== i));
  }

  function handleWhatsApp(v: string) {
    let val = v.replace(/\D/g, "").slice(0, 11);
    if (val.length > 0) val = val.replace(/^(\d{2})(\d)/, "($1) $2");
    if (val.length > 5) val = val.replace(/(\d{5})(\d)/, "$1-$2");
    setWhatsapp(val);
  }

  // Navigation
  function canProceed(): boolean {
    if (step === 0) {
      return (
        (artSource === "vitrine" && !!selectedFigurinha) ||
        (artSource === "upload" && files.length > 0)
      );
    }
    if (step === 1) return !!finish;
    if (step === 2) return !!whatsapp && !!nome && quantidade >= 1;
    return false;
  }

  function nextStep() {
    if (canProceed() && step < 2) setStep((s) => s + 1);
  }

  function prevStep() {
    if (step > 0) setStep((s) => s - 1);
  }

  // Submit
  async function handleSubmit() {
    if (!canProceed() || sending) return;
    setSending(true);

    const form = new FormData();
    form.set("cliente_nome", nome);
    form.set("cliente_whatsapp", whatsapp.replace(/\D/g, ""));
    form.set("quantidade", String(quantidade));
    form.set("largura_cm", largura);
    form.set("altura_cm", altura);
    form.set("tamanho_estimado", largura && altura ? `${largura}x${altura} cm` : "");
    form.set("tipo_acabamento", finish);

    if (selectedFigurinha && artSource === "vitrine") {
      form.set("referencia_figurinha_id", String(selectedFigurinha.id));
    }

    files.forEach((f) => form.append("artworks", f));

    try {
      const res = await fetch("/api/pedidos", { method: "POST", body: form });
      const data = await res.json();
      if (data.success) {
        setSent(true);
        window.open(data.whatsapp_link, "_blank");
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
    <div className={cn("glass-gold rounded-2xl p-6 sm:p-8", className)}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-gold-400" />
        </div>
        <div>
          <h3 className="font-bold text-white text-lg font-display">
            Configurador de Pedido
          </h3>
          <p className="text-xs text-graphite-400">
            Monte seu adesivo premium em 3 passos
          </p>
        </div>
      </div>

      {/* Stepper */}
      <LuxuryStepper steps={STEPS} currentStep={step} className="mb-8" />

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {/* ── STEP 0: Art Source ─────────────────────────── */}
          {step === 0 && (
            <div className="space-y-4">
              <p className="text-sm text-graphite-400 mb-4">
                Escolha de onde vem a arte do seu adesivo
              </p>

              {/* Option A: From Vitrine */}
              <button
                onClick={() => setArtSource("vitrine")}
                className={cn(
                  "w-full text-left p-4 rounded-xl border transition-all",
                  artSource === "vitrine"
                    ? "bg-gold-500/5 border-gold-500/30 ring-1 ring-gold-500/10"
                    : "bg-graphite-800/50 border-graphite-700 hover:border-graphite-600"
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                      artSource === "vitrine"
                        ? "bg-gold-500/10 text-gold-400"
                        : "bg-graphite-700 text-graphite-400"
                    )}
                  >
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white mb-1">
                      Da Vitrine
                    </p>
                    <p className="text-xs text-graphite-400">
                      Selecionar um modelo da galeria como referência
                    </p>
                    {selectedFigurinha && artSource === "vitrine" && (
                      <div className="mt-3 flex items-center gap-3 p-3 rounded-lg bg-graphite-800/50 border border-graphite-700">
                        {selectedFigurinha.url_imagem && (
                          <img
                            src={`/static/${selectedFigurinha.url_imagem}`}
                            alt=""
                            className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                          />
                        )}
                        <div>
                          <p className="text-sm font-medium text-white">
                            {selectedFigurinha.titulo}
                          </p>
                          <p className="text-xs text-gold-400 flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            Selecionado
                          </p>
                        </div>
                      </div>
                    )}
                    {(!selectedFigurinha || artSource !== "vitrine") && (
                      <p className="text-xs text-gold-500 mt-2 flex items-center gap-1">
                        <ArrowRight className="w-3 h-3" />
                        Clique em um modelo na galeria abaixo
                      </p>
                    )}
                  </div>
                </div>
              </button>

              {/* Option B: Upload */}
              <button
                onClick={() => setArtSource("upload")}
                className={cn(
                  "w-full text-left p-4 rounded-xl border transition-all",
                  artSource === "upload"
                    ? "bg-gold-500/5 border-gold-500/30 ring-1 ring-gold-500/10"
                    : "bg-graphite-800/50 border-graphite-700 hover:border-graphite-600"
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                      artSource === "upload"
                        ? "bg-gold-500/10 text-gold-400"
                        : "bg-graphite-700 text-graphite-400"
                    )}
                  >
                    <Upload className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white mb-1">
                      Upload Próprio
                    </p>
                    <p className="text-xs text-graphite-400">
                      Envie sua própria arte ou logotipo
                    </p>
                  </div>
                </div>
              </button>

              {/* Upload Zone (visible when upload selected) */}
              {artSource === "upload" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="space-y-3"
                >
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOver(false);
                      handleFiles(e.dataTransfer.files);
                    }}
                    onClick={() => !files.length && fileRef.current?.click()}
                    className={cn(
                      "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all",
                      dragOver
                        ? "border-gold-500/50 bg-gold-500/5"
                        : files.length
                          ? "border-emerald-500/30 bg-emerald-500/5"
                          : "border-graphite-700 hover:border-graphite-500 bg-graphite-800/30"
                    )}
                  >
                    <input
                      ref={fileRef}
                      type="file"
                      accept=".png,.jpg,.jpeg,.svg,.webp,.pdf"
                      multiple
                      className="hidden"
                      onChange={(e) => handleFiles(e.target.files)}
                    />
                    {files.length === 0 ? (
                      <>
                        <Upload className="w-8 h-8 mx-auto text-graphite-500 mb-2" />
                        <p className="text-sm text-graphite-400">
                          Clique ou arraste sua arte
                        </p>
                        <p className="text-xs text-graphite-600 mt-1">
                          PNG, JPG, SVG, PDF — máx 16MB
                        </p>
                      </>
                    ) : (
                      <div className="space-y-2">
                        {files.map((f, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between bg-graphite-800 rounded-lg px-3 py-2"
                          >
                            <div className="flex items-center gap-2">
                              <Image className="w-4 h-4 text-gold-400" />
                              <span className="text-xs text-graphite-300 truncate max-w-[200px]">
                                {f.name}
                              </span>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeFile(i);
                              }}
                              className="text-graphite-500 hover:text-red-400"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                        <p className="text-xs text-graphite-500">
                          Clique para adicionar mais arquivos
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {/* ── STEP 1: Finish ─────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-graphite-400 mb-4">
                Escolha o acabamento que define o estilo do seu adesivo
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {FINISHES.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setFinish(f.value)}
                    className={cn(
                      "p-4 rounded-xl text-left transition-all border",
                      finish === f.value
                        ? "bg-gold-500/5 border-gold-500/40 shadow-lg shadow-gold-500/5"
                        : "bg-graphite-800/50 border-graphite-700 hover:border-graphite-600"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{f.icon}</span>
                      <div>
                        <p
                          className={cn(
                            "text-sm font-semibold mb-0.5",
                            finish === f.value
                              ? "text-gold-400"
                              : "text-white"
                          )}
                        >
                          {f.label}
                        </p>
                        <p className="text-xs text-graphite-400">{f.desc}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── STEP 2: Dimensions + Contact ────────────────── */}
          {step === 2 && (
            <div className="space-y-5">
              <p className="text-sm text-graphite-400">
                Defina as dimensões e informe seu contato
              </p>

              {/* Dimensions */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-graphite-400 mb-1.5">
                    Largura (cm)
                  </label>
                  <input
                    type="number"
                    value={largura}
                    onChange={(e) => setLargura(e.target.value)}
                    min="1"
                    max="200"
                    placeholder="Ex: 10"
                    className="w-full bg-graphite-800 border border-graphite-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-graphite-600 focus:outline-none focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-graphite-400 mb-1.5">
                    Altura (cm)
                  </label>
                  <input
                    type="number"
                    value={altura}
                    onChange={(e) => setAltura(e.target.value)}
                    min="1"
                    max="200"
                    placeholder="Ex: 8"
                    className="w-full bg-graphite-800 border border-graphite-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-graphite-600 focus:outline-none focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/20 transition-all"
                  />
                </div>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-xs font-medium text-graphite-400 mb-1.5">
                  Quantidade
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setQuantidade(Math.max(1, quantidade - 1))}
                    className="w-10 h-10 rounded-xl bg-graphite-800 border border-graphite-700 flex items-center justify-center text-graphite-300 hover:bg-graphite-700 hover:text-white transition-all active:scale-95"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    value={quantidade}
                    onChange={(e) =>
                      setQuantidade(
                        Math.max(1, parseInt(e.target.value) || 1)
                      )
                    }
                    min="1"
                    className="w-20 text-center bg-graphite-800 border border-graphite-700 rounded-xl py-2.5 text-white text-sm font-bold focus:outline-none focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setQuantidade(quantidade + 1)}
                    className="w-10 h-10 rounded-xl bg-graphite-800 border border-graphite-700 flex items-center justify-center text-graphite-300 hover:bg-graphite-700 hover:text-white transition-all active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <span className="text-xs text-graphite-500">unidades</span>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-medium text-graphite-400 mb-1.5">
                  Seu Nome
                </label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Digite seu nome completo"
                  required
                  className="w-full bg-graphite-800 border border-graphite-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-graphite-600 focus:outline-none focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/20 transition-all"
                />
              </div>

              {/* WhatsApp */}
              <div>
                <label className="block text-xs font-medium text-graphite-400 mb-1.5">
                  Seu WhatsApp
                </label>
                <input
                  type="tel"
                  value={whatsapp}
                  onChange={(e) => handleWhatsApp(e.target.value)}
                  maxLength={15}
                  required
                  placeholder="(11) 99999-9999"
                  className="w-full bg-graphite-800 border border-graphite-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-graphite-600 focus:outline-none focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/20 transition-all"
                />
              </div>

              {/* Sent success */}
              {sent && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm text-center"
                >
                  <Check className="w-5 h-5 mx-auto mb-1" />
                  Orçamento enviado! O WhatsApp foi aberto em uma nova aba.
                </motion.div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation Buttons */}
      <div className="flex items-center gap-3 mt-8 pt-6 border-t border-graphite-800">
        {step > 0 ? (
          <button
            onClick={prevStep}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-graphite-800 hover:bg-graphite-700 text-sm font-medium text-white transition-all active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
        ) : (
          <div />
        )}

        <div className="flex-1" />

        {step < 2 ? (
          <button
            onClick={nextStep}
            disabled={!canProceed()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gold-600 hover:bg-gold-500 text-graphite-900 text-sm font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 shadow-lg shadow-gold-600/10"
          >
            Próximo
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!canProceed() || sending}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gold-600 hover:bg-gold-500 text-graphite-900 text-sm font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 shadow-lg shadow-gold-600/10"
          >
            {sending ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-graphite-900/30 border-t-graphite-900 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Gerar Orçamento no WhatsApp
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
