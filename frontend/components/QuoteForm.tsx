"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spotlight } from "@/components/Spotlight";
import { cn } from "@/lib/utils";
import { Upload, Zap, Send, Check, X } from "lucide-react";

const FINISHES = [
  { value: "Brilhante", icon: "✨", desc: "Alto brilho" },
  { value: "Fosco", icon: "🌫️", desc: "Sem reflexo" },
  { value: "Refletivo", icon: "💎", desc: "Retroreflexivo" },
  { value: "Holográfico", icon: "🌈", desc: "Efeito arco-íris" },
];

const SIZES = ["5x5 cm", "8x8 cm", "10x10 cm", "Personalizado"];

interface QuoteFormProps {
  referenciaFigurinhaId: number | null;
  onTextureUpload: (url: string) => void;
  className?: string;
}

export default function QuoteForm({
  referenciaFigurinhaId,
  onTextureUpload,
  className,
}: QuoteFormProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [size, setSize] = useState("");
  const [customSize, setCustomSize] = useState("");
  const [finish, setFinish] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [sending, setSending] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFiles(newFiles: FileList | null) {
    if (!newFiles) return;
    const arr = Array.from(newFiles).slice(0, 5);
    setFiles((prev) => [...prev, ...arr].slice(0, 5));
    // Apply first image as texture
    if (arr.length > 0) {
      onTextureUpload(URL.createObjectURL(arr[0]));
    }
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

  const finalSize = size === "Personalizado" ? customSize : size;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    const form = new FormData(e.target as HTMLFormElement);
    form.set("tamanho_estimado", finalSize);
    form.set("tipo_acabamento", finish);
    files.forEach((f) => form.append("artworks", f));
    if (referenciaFigurinhaId) {
      form.set("referencia_figurinha_id", String(referenciaFigurinhaId));
    }

    try {
      const res = await fetch("/api/pedidos", { method: "POST", body: form });
      const data = await res.json();
      if (data.success) {
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
    <Spotlight className="rounded-2xl" color="rgba(236,72,153,0.08)">
      <div className={cn("glass rounded-2xl p-6 sm:p-8", className)}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-full bg-pink-600/20 border border-pink-500/30 flex items-center justify-center">
            <Zap className="w-4 h-4 text-pink-400" />
          </div>
          <div>
            <h3 className="font-bold text-white text-lg">Solicitar Orçamento</h3>
            <p className="text-xs text-zinc-500">Monte seu adesivo e receba via WhatsApp</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <input type="hidden" name="cliente_nome" value="Cliente Simulador" />
          <input
            type="hidden"
            name="referencia_figurinha_id"
            value={referenciaFigurinhaId || ""}
          />
          <input type="hidden" name="quantidade" value="1" />
          <input type="hidden" name="urgencia" value="" />

          {/* Upload */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-2">
              Sua Arte ou Imagem
            </label>
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-zinc-800 hover:border-pink-500/40 rounded-xl p-5 text-center cursor-pointer transition-colors bg-zinc-900/50"
            >
              <Upload className="w-6 h-6 mx-auto text-zinc-600 mb-2" />
              <p className="text-sm text-zinc-500">Clique para fazer upload</p>
              <p className="text-xs text-zinc-600 mt-0.5">PNG, JPG, PDF — máx 16MB</p>
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
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-zinc-800 rounded-lg text-xs text-zinc-300"
                  >
                    {f.name.slice(0, 20)}
                    <button type="button" onClick={() => removeFile(i)}>
                      <X className="w-3 h-3 text-zinc-500 hover:text-red-400" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Size selector */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-2">
              Tamanho do Adesivo
            </label>
            <div className="grid grid-cols-4 gap-2">
              {SIZES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSize(s)}
                  className={cn(
                    "py-2 rounded-lg text-xs font-medium transition-all border",
                    size === s
                      ? "bg-pink-600/20 border-pink-500/50 text-pink-300"
                      : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
            {size === "Personalizado" && (
              <input
                type="text"
                value={customSize}
                onChange={(e) => setCustomSize(e.target.value)}
                placeholder="Ex: 12x8 cm"
                className="mt-2 w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-pink-500/50"
              />
            )}
          </div>

          {/* Finish selector */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-2">
              Acabamento
            </label>
            <div className="grid grid-cols-2 gap-2">
              {FINISHES.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setFinish(f.value)}
                  className={cn(
                    "py-3 rounded-xl text-center transition-all border",
                    finish === f.value
                      ? "bg-pink-600/10 border-pink-500/40 text-pink-200 glow-sm"
                      : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                  )}
                >
                  <span className="text-lg block">{f.icon}</span>
                  <span className="text-xs font-semibold">{f.value}</span>
                  <span className="text-[10px] text-zinc-500 block">{f.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* WhatsApp */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-2">
              Seu WhatsApp
            </label>
            <input
              type="tel"
              value={whatsapp}
              onChange={(e) => handleWhatsApp(e.target.value)}
              maxLength={15}
              required
              placeholder="(11) 99999-9999"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-pink-500/50 transition-colors"
            />
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={sending || !finish || !whatsapp}
            className="w-full h-12 bg-gradient-to-r from-pink-600 to-pink-500 hover:from-pink-500 hover:to-pink-400 text-white font-bold rounded-xl shadow-lg shadow-pink-600/20 hover:shadow-pink-500/40 transition-all disabled:opacity-40"
          >
            {sending ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                Enviando...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Send className="w-4 h-4" />
                Gerar Orçamento no WhatsApp
              </span>
            )}
          </Button>
        </form>
      </div>
    </Spotlight>
  );
}
