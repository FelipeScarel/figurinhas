"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Upload, Send, X, Sun, Moon, Maximize2, Minimize2 } from "lucide-react";

interface UploadPanelProps {
  textureUrl: string | null;
  helmetColor: "white" | "black";
  decalScale: number;
  onColorChange: (c: "white" | "black") => void;
  onTextureUpload: (url: string) => void;
  onScaleChange: (s: number) => void;
  className?: string;
}

export default function UploadPanel({
  textureUrl,
  helmetColor,
  decalScale,
  onColorChange,
  onTextureUpload,
  onScaleChange,
  className,
}: UploadPanelProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFiles(newFiles: FileList | null) {
    if (!newFiles) return;
    const arr = Array.from(newFiles).slice(0, 1);
    setFiles(arr);
    if (arr.length > 0) onTextureUpload(URL.createObjectURL(arr[0]));
  }

  function removeFile() {
    setFiles([]);
    onTextureUpload("");
  }

  async function handleSend() {
    if (!textureUrl) return;
    setSending(true);
    const formData = new FormData();
    formData.set("cliente_nome", "Cliente");
    formData.set("cliente_whatsapp", "11999999999");
    formData.set("quantidade", "1");
    formData.set("tamanho_estimado", "A definir");
    formData.set("tipo_acabamento", "Brilhante");
    formData.set("observacoes", `Cor do capacete: ${helmetColor === "white" ? "Branco" : "Preto"}`);
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
    <div className={cn("flex flex-col gap-4", className)}>
      {/* ── Color Picker ── */}
      <div>
        <label className="text-xs font-medium text-zinc-400 mb-2 block">
          Cor do Capacete
        </label>
        <div className="flex gap-2">
          {([
            { key: "white" as const, label: "Branco", icon: Sun, bg: "bg-white", ring: "ring-white/30" },
            { key: "black" as const, label: "Preto", icon: Moon, bg: "bg-zinc-800", ring: "ring-zinc-600/30" },
          ]).map(({ key, label, icon: Icon, bg, ring }) => (
            <button
              key={key}
              onClick={() => onColorChange(key)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold border transition-all",
                helmetColor === key
                  ? `${bg} text-zinc-900 border-zinc-600 ring-1 ${ring}`
                  : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Upload ── */}
      <div>
        <label className="text-xs font-medium text-zinc-400 mb-2 block">
          Sua Figurinha
        </label>
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
          onClick={() => !files.length && fileRef.current?.click()}
          className={cn(
            "border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all",
            dragOver
              ? "border-pink-500/50 bg-pink-500/5"
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
              <Upload className="w-5 h-5 text-zinc-500 mx-auto mb-1.5" />
              <p className="text-xs text-zinc-400">Clique ou arraste sua imagem</p>
              <p className="text-[10px] text-zinc-600 mt-0.5">PNG, JPG, SVG</p>
            </>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg overflow-hidden border border-zinc-700 flex-shrink-0">
                  <img src={URL.createObjectURL(files[0])} alt="" className="w-full h-full object-cover" />
                </div>
                <p className="text-xs text-emerald-400 truncate max-w-[140px]">{files[0].name}</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); removeFile(); }}
                className="w-6 h-6 rounded-full bg-zinc-800 hover:bg-red-600/50 flex items-center justify-center"
              >
                <X className="w-3 h-3 text-zinc-400" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Size Slider ── */}
      {textureUrl && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="space-y-1.5"
        >
          <label className="text-xs font-medium text-zinc-400 flex items-center justify-between">
            <span>Tamanho da Figurinha</span>
            <span className="text-zinc-600 text-[10px]">{Math.round(decalScale * 100)}%</span>
          </label>
          <div className="flex items-center gap-3">
            <Minimize2 className="w-3.5 h-3.5 text-zinc-500" />
            <input
              type="range"
              min={30}
              max={200}
              value={Math.round(decalScale * 100)}
              onChange={(e) => onScaleChange(Number(e.target.value) / 100)}
              className="flex-1 h-1.5 rounded-full appearance-none bg-zinc-800 accent-pink-500 cursor-pointer"
              style={{
                WebkitAppearance: "none",
                appearance: "none",
                background: `linear-gradient(to right, #ec4899 0%, #ec4899 ${(decalScale - 0.3) / 1.7 * 100}%, #27272a ${(decalScale - 0.3) / 1.7 * 100}%, #27272a 100%)`,
                height: 4,
                borderRadius: 2,
                outline: "none",
              }}
            />
            <Maximize2 className="w-3.5 h-3.5 text-zinc-500" />
          </div>
        </motion.div>
      )}

      {/* ── Send ── */}
      <Button
        onClick={handleSend}
        disabled={sending || !textureUrl}
        className="w-full h-10 bg-gradient-to-r from-pink-600 to-pink-500 hover:from-pink-500 hover:to-pink-400 text-white font-semibold rounded-xl shadow-lg shadow-pink-600/15 text-sm disabled:opacity-40"
      >
        {sending ? (
          <span className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            Enviando...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Send className="w-4 h-4" />
            Pedir Orçamento no WhatsApp
          </span>
        )}
      </Button>
    </div>
  );
}
