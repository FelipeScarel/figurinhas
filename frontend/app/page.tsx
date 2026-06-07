"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Sparkles, ShoppingBag, Star, Send, Upload, X, Image } from "lucide-react";

// ── Types ─────────────────────────────────────────
interface Figurinha {
  id: number;
  titulo: string;
  descricao: string;
  url_imagem: string;
  preco: number | null;
}

const FINISHES = [
  { value: "Brilhante", icon: "✨", label: "Brilhante" },
  { value: "Fosco Acetinado", icon: "🌫️", label: "Fosco" },
  { value: "Refletivo Premium", icon: "💎", label: "Refletivo" },
  { value: "Holográfico Luxo", icon: "🌈", label: "Holográfico" },
];

// ── Navbar ────────────────────────────────────────
function Navbar() {
  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <a href="#" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-white font-extrabold text-xs">
            FS
          </div>
          <span className="font-bold text-gray-900 text-lg">
            Figurinhas<span className="text-gold-600">.</span>
          </span>
        </a>
        <div className="flex items-center gap-3">
          <a href="#vitrine" className="text-sm text-gray-500 hover:text-gray-900">Vitrine</a>
          <a href="#orcamento" className="text-sm text-gray-500 hover:text-gray-900">Orçamento</a>
          <a href="/admin/login" className="text-xs text-gray-400 hover:text-gray-600">Admin</a>
          <a href="#orcamento" className="inline-flex items-center gap-1.5 bg-gold-500 hover:bg-gold-600 text-white rounded-full px-4 py-2 text-sm font-semibold transition-colors">
            <Sparkles className="w-3.5 h-3.5" />
            Pedir Orçamento
          </a>
        </div>
      </div>
    </nav>
  );
}

// ── Page ──────────────────────────────────────────
export default function Home() {
  const [figurinhas, setFigurinhas] = useState<Figurinha[]>([]);
  const [selectedFig, setSelectedFig] = useState<Figurinha | null>(null);

  // ── Form state ────────────────────────────
  const [files, setFiles] = useState<File[]>([]);
  const [finish, setFinish] = useState("");
  const [largura, setLargura] = useState("");
  const [altura, setAltura] = useState("");
  const [quantidade, setQuantidade] = useState(10);
  const [nome, setNome] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [sending, setSending] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/figurinhas")
      .then((r) => r.json())
      .then(setFigurinhas)
      .catch(() => {});
  }, []);

  // ── File handlers ─────────────────────────
  function handleFiles(newFiles: FileList | null) {
    if (!newFiles) return;
    setFiles((prev) => [...prev, ...Array.from(newFiles)].slice(0, 5));
  }
  function removeFile(i: number) { setFiles((prev) => prev.filter((_, idx) => idx !== i)); }

  function handleWhatsApp(v: string) {
    let val = v.replace(/\D/g, "").slice(0, 11);
    if (val.length > 5) val = val.replace(/(\d{5})(\d)/, "$1-$2");
    if (val.length > 0) val = val.replace(/^(\d{2})(\d)/, "($1) $2");
    setWhatsapp(val);
  }

  // ── Submit ────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nome || !whatsapp || !finish) return;
    setSending(true);

    const form = new FormData();
    form.set("cliente_nome", nome);
    form.set("cliente_whatsapp", whatsapp.replace(/\D/g, ""));
    form.set("quantidade", String(quantidade));
    form.set("largura_cm", largura);
    form.set("altura_cm", altura);
    form.set("tamanho_estimado", largura && altura ? `${largura}x${altura} cm` : "");
    form.set("tipo_acabamento", finish);
    if (selectedFig) form.set("referencia_figurinha_id", String(selectedFig.id));
    files.forEach((f) => form.append("artworks", f));

    try {
      const res = await fetch("/api/pedidos", { method: "POST", body: form });
      const data = await res.json();
      if (data.success) window.open(data.whatsapp_link, "_blank");
      else alert(data.errors?.join("\n") || "Erro.");
    } catch { alert("Erro de conexão."); }
    finally { setSending(false); }
  }

  const formatPrice = (p: number | null) =>
    p ? `R$ ${p.toFixed(2).replace(".", ",")}` : "Sob Consulta";

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero */}
      <section className="py-16 sm:py-24 text-center px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold-50 text-gold-700 text-xs font-medium border border-gold-200 mb-5">
            <Sparkles className="w-3 h-3" /> Adesivos Premium
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
            Adesivos de <span className="text-gold-600">Qualidade</span>
          </h1>
          <p className="text-gray-500 max-w-lg mx-auto text-sm sm:text-base">
            Escolha um modelo ou envie sua arte. A gente produz e entrega.
          </p>
        </motion.div>
      </section>

      {/* Vitrine */}
      <section id="vitrine" className="py-16 px-4 max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Nossos Modelos</h2>
          <p className="text-gray-500 text-sm">Clique para selecionar e pedir orçamento</p>
        </div>

        {figurinhas.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <ShoppingBag className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>Nenhum modelo cadastrado ainda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {figurinhas.map((fig, i) => (
              <motion.div
                key={fig.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.03 }}
                onClick={() => setSelectedFig(prev => prev?.id === fig.id ? null : fig)}
                className={`bg-white rounded-xl border-2 overflow-hidden cursor-pointer transition-all hover:shadow-md ${
                  selectedFig?.id === fig.id
                    ? "border-gold-500 shadow-md shadow-gold-100"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
                  {fig.url_imagem ? (
                    <img
                      src={`/static/${fig.url_imagem}`}
                      alt={fig.titulo}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <Image className="w-8 h-8 text-gray-300" />
                  )}
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-sm text-gray-900 truncate">{fig.titulo}</h3>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{fig.descricao}</p>
                  <p className={`text-sm font-bold mt-2 ${fig.preco ? "text-gold-700" : "text-gray-400"}`}>
                    {formatPrice(fig.preco)}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Orçamento */}
      <section id="orcamento" className="py-16 px-4 bg-white border-t border-gray-200">
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Solicitar Orçamento</h2>
            <p className="text-gray-500 text-sm">
              {selectedFig
                ? `Modelo selecionado: ${selectedFig.titulo}`
                : "Preencha os dados abaixo"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Sua Arte (opcional)</label>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
                onClick={() => !files.length && fileRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors ${
                  dragOver ? "border-gold-400 bg-gold-50" :
                  files.length ? "border-green-300 bg-green-50" :
                  "border-gray-300 hover:border-gray-400 bg-gray-50"
                }`}
              >
                <input ref={fileRef} type="file" accept=".png,.jpg,.jpeg,.svg,.webp,.pdf" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
                {files.length === 0 ? (
                  <>
                    <Upload className="w-6 h-6 mx-auto text-gray-400 mb-1" />
                    <p className="text-sm text-gray-500">Clique ou arraste sua imagem</p>
                    <p className="text-xs text-gray-400 mt-0.5">PNG, JPG, SVG, PDF</p>
                  </>
                ) : (
                  <div className="space-y-1.5">
                    {files.map((f, i) => (
                      <div key={i} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-gray-200">
                        <span className="text-sm text-gray-700 truncate">{f.name}</span>
                        <button type="button" onClick={(e) => { e.stopPropagation(); removeFile(i); }} className="text-gray-400 hover:text-red-500"><X className="w-4 h-4" /></button>
                      </div>
                    ))}
                    <p className="text-xs text-gray-400">Clique para adicionar mais</p>
                  </div>
                )}
              </div>
            </div>

            {/* Acabamento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Acabamento</label>
              <div className="grid grid-cols-4 gap-2">
                {FINISHES.map((f) => (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => setFinish(f.value)}
                    className={`py-3 rounded-xl text-center border transition-all ${
                      finish === f.value
                        ? "border-gold-500 bg-gold-50 text-gold-700"
                        : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
                    }`}
                  >
                    <span className="text-lg block">{f.icon}</span>
                    <span className="text-[10px] font-medium">{f.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Dimensões + Quantidade */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Largura (cm)</label>
                <input type="number" value={largura} onChange={(e) => setLargura(e.target.value)} placeholder="10" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Altura (cm)</label>
                <input type="number" value={altura} onChange={(e) => setAltura(e.target.value)} placeholder="8" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Quantidade</label>
                <input type="number" value={quantidade} onChange={(e) => setQuantidade(Math.max(1, parseInt(e.target.value) || 1))} min="1" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500" />
              </div>
            </div>

            {/* Contato */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Seu Nome *</label>
                <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} required placeholder="Nome completo" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">WhatsApp *</label>
                <input type="tel" value={whatsapp} onChange={(e) => handleWhatsApp(e.target.value)} maxLength={15} required placeholder="(11) 99999-9999" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500" />
              </div>
            </div>

            {/* Submit */}
            <button type="submit" disabled={sending || !nome || !whatsapp || !finish} className="w-full py-3 bg-gold-500 hover:bg-gold-600 disabled:bg-gray-300 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors text-sm">
              {sending ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {sending ? "Enviando..." : "Enviar Orçamento via WhatsApp"}
            </button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center border-t border-gray-200 bg-white">
        <p className="text-sm text-gray-400">© {new Date().getFullYear()} Figurinhas. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
