"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Spotlight } from "@/components/Spotlight";
import { Upload, Image, Smartphone, Shield, Send, X, ArrowRight } from "lucide-react";

const FINISHES = [
  { value: "Brilhante", desc: "Alto brilho", icon: "✨" },
  { value: "Fosco", desc: "Sem reflexo", icon: "🌫️" },
  { value: "Refletivo", desc: "Retroreflexivo", icon: "💎" },
  { value: "Holográfico", desc: "Arco-íris", icon: "🌈" },
];

type ModelType = "capacete" | "capinha";

interface UploadPanelProps {
  textureUrl: string | null;
  modelType: ModelType;
  onModelChange: (m: ModelType) => void;
  onTextureUpload: (url: string) => void;
  className?: string;
}

export default function UploadPanel({
  textureUrl,
  modelType,
  onModelChange,
  onTextureUpload,
  className,
}: UploadPanelProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [size, setSize] = useState("8x8 cm");
  const [finish, setFinish] = useState("Brilhante");
  const [whatsapp, setWhatsapp] = useState("");
  const [sending, setSending] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFiles(newFiles: FileList | null) {
    if (!newFiles) return;
    const arr = Array.from(newFiles).slice(0, 3);
    setFiles(arr);
    if (arr.length > 0) onTextureUpload(URL.createObjectURL(arr[0]));
  }

  function removeFile() {
    setFiles([]);
    onTextureUpload("");
  }

  function handleWhatsApp(v: string) {
    let val = v.replace(/\D/g, "").slice(0, 11);
    if (val.length > 0) val = val.replace(/^(\d{2})(\d)/, "($1) $2");
    if (val.length > 5) val = val.replace(/(\d{5})(\d)/, "$1-$2");
    setWhatsapp(val);
  }

  async function handleSend() {
    if (!whatsapp) return;
    setSending(true);

    const formData = new FormData();
    formData.set("cliente_nome", "Cliente Simulador");
    formData.set("cliente_whatsapp", whatsapp);
    formData.set("quantidade", "1");
    formData.set("tamanho_estimado", size);
    formData.set("tipo_acabamento", finish);
    formData.set("urgencia", "");
    formData.set("observacoes", `Modelo: ${modelType === "capacete" ? "Capacete" : "Capinha"} | Tamanho: ${size} | Acabamento: ${finish}`);
    files.forEach((f) => formData.append("artworks", f));

    try {
      const res = await fetch("/api/pedidos", { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) window.open(data.whatsapp_link, "_blank");
      else alert(data.errors?.join("\n") || "Erro.");
    } catch {
      alert("Erro de conexão.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className={cn("flex flex-col gap-5", className)}>
      {/* ── Model Toggle ── */}
      <div className="flex gap-1 bg-zinc-900/90 backdrop-blur-xl border border-zinc-800/50 rounded-full p-1 self-start">
        {([
          { key: "capacete" as ModelType, label: "Capacete", icon: Shield },
          { key: "capinha" as ModelType, label: "Capinha", icon: Smartphone },
        ]).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => onModelChange(key)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all",
              modelType === key
                ? "bg-pink-600 text-white shadow-lg shadow-pink-600/20"
                : "text-zinc-400 hover:text-white"
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* ── Upload Zone ── */}
      <Spotlight className="rounded-xl" color="rgba(236,72,153,0.06)">
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
          onClick={() => !files.length && fileRef.current?.click()}
          className={cn(
            "border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all",
            dragOver
              ? "border-pink-500/60 bg-pink-500/5"
              : files.length
                ? "border-emerald-500/30 bg-emerald-500/5"
                : "border-zinc-800 hover:border-zinc-600 bg-zinc-900/40"
          )}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".png,.jpg,.jpeg,.svg,.webp"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />

          {files.length === 0 ? (
            <>
              <div className="w-12 h-12 rounded-2xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center mx-auto mb-3">
                <Upload className="w-5 h-5 text-pink-400" />
              </div>
              <p className="text-sm text-zinc-300 font-medium mb-1">
                Arraste sua arte aqui
              </p>
              <p className="text-xs text-zinc-500">
                ou clique para buscar no computador
              </p>
              <p className="text-[10px] text-zinc-600 mt-2">
                PNG, JPG, SVG — máx 16MB
              </p>
            </>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg overflow-hidden border border-zinc-700 flex-shrink-0">
                  <img
                    src={URL.createObjectURL(files[0])}
                    alt="preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-left">
                  <p className="text-sm text-emerald-400 font-medium truncate max-w-[160px]">
                    {files[0].name}
                  </p>
                  <p className="text-[10px] text-zinc-500">Arte carregada</p>
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); removeFile(); }}
                className="w-7 h-7 rounded-full bg-zinc-800 hover:bg-red-600/50 flex items-center justify-center transition-colors"
              >
                <X className="w-3 h-3 text-zinc-400 hover:text-white" />
              </button>
            </div>
          )}
        </div>
      </Spotlight>

      {/* ── Size Selector ── */}
      <div>
        <label className="text-xs font-medium text-zinc-400 mb-2 block">Tamanho do Adesivo</label>
        <div className="grid grid-cols-4 gap-1.5">
          {["5x5", "8x8", "10x10", "Outro"].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSize(s === "Outro" ? "Personalizado" : `${s} cm`)}
              className={cn(
                "py-2 rounded-lg text-[11px] font-semibold transition-all border",
                size === `${s} cm` || (s === "Outro" && size === "Personalizado")
                  ? "bg-pink-600/15 border-pink-500/40 text-pink-300"
                  : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700"
              )}
            >
              {s === "Outro" ? "Outro" : `${s} cm`}
            </button>
          ))}
        </div>
      </div>

      {/* ── Finish ── */}
      <div>
        <label className="text-xs font-medium text-zinc-400 mb-2 block">Acabamento</label>
        <div className="grid grid-cols-2 gap-1.5">
          {FINISHES.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFinish(f.value)}
              className={cn(
                "py-2.5 px-3 rounded-lg text-left transition-all border",
                finish === f.value
                  ? "bg-pink-600/10 border-pink-500/30 text-pink-200"
                  : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700"
              )}
            >
              <span className="text-xs font-semibold">{f.icon} {f.value}</span>
              <span className="text-[10px] text-zinc-500 block">{f.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── WhatsApp + Send ── */}
      <div className="space-y-2">
        <input
          type="tel"
          value={whatsapp}
          onChange={(e) => handleWhatsApp(e.target.value)}
          maxLength={15}
          placeholder="Seu WhatsApp: (11) 99999-9999"
          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-pink-500/50 transition-colors"
        />
        <Button
          onClick={handleSend}
          disabled={sending || !whatsapp}
          className="w-full h-11 bg-gradient-to-r from-pink-600 to-pink-500 hover:from-pink-500 hover:to-pink-400 text-white font-bold rounded-xl shadow-lg shadow-pink-600/20 transition-all disabled:opacity-40"
        >
          {sending ? (
            <span className="flex items-center gap-2">
              <span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
              Enviando...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Send className="w-4 h-4" />
              Pedir Orçamento via WhatsApp
            </span>
          )}
        </Button>
      </div>

      {/* ── Status ── */}
      {textureUrl && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-xs text-emerald-400"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Visualização 3D atualizada
        </motion.div>
      )}
    </div>
  );
}
