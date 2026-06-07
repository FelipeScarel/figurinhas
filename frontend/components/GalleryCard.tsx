"use client";

import { motion } from "framer-motion";
import { cn, formatPrice } from "@/lib/utils";
import { Sparkles, ArrowRight } from "lucide-react";

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

interface GalleryCardProps {
  figurinha: Figurinha;
  index: number;
  isSelected: boolean;
  onSelect: (fig: Figurinha) => void;
}

export default function GalleryCard({
  figurinha,
  index,
  isSelected,
  onSelect,
}: GalleryCardProps) {
  const tags: string[] = (() => {
    try {
      const parsed = JSON.parse(figurinha.tags || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  })();

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay: index * 0.04, duration: 0.5 }}
      className="break-inside-avoid"
    >
      <div
        className={cn(
          "glass rounded-2xl overflow-hidden group cursor-pointer transition-all duration-500",
          isSelected
            ? "border-gold-500/30 ring-1 ring-gold-500/20 shadow-lg shadow-gold-500/5"
            : "hover:border-gold-500/15 hover:shadow-lg hover:shadow-gold-500/5"
        )}
        onClick={() => onSelect(figurinha)}
      >
        {/* Image Container */}
        <div className="aspect-[4/3] bg-graphite-800 overflow-hidden relative">
          {figurinha.url_imagem ? (
            <img
              src={`/static/${figurinha.url_imagem}`}
              alt={figurinha.titulo}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-graphite-600 text-sm">
              Sem imagem
            </div>
          )}

          {/* Shimmer overlay on hover */}
          <div className="absolute inset-0 shimmer-bg opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

          {/* Category badge */}
          {figurinha.categoria_nome && (
            <div className="absolute top-3 left-3">
              <span className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-graphite-900/80 backdrop-blur-sm text-gold-400 border border-gold-500/20">
                {figurinha.categoria_nome}
              </span>
            </div>
          )}

          {/* Hover action overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-graphite-900/90 via-graphite-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-5">
            <p className="text-white/90 text-xs leading-relaxed line-clamp-3 mb-3">
              {figurinha.descricao}
            </p>
            <button
              className="inline-flex items-center gap-2 self-start px-4 py-2 rounded-full bg-gold-500 text-graphite-900 text-xs font-bold hover:bg-gold-400 transition-all shadow-lg shadow-gold-500/20 active:scale-95"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(figurinha);
              }}
            >
              <Sparkles className="w-3 h-3" />
              {isSelected ? "Selecionado" : "Selecionar"}
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* Selected indicator */}
          {isSelected && (
            <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-gold-500 flex items-center justify-center text-graphite-900">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <h3 className="font-semibold text-sm text-white truncate">
              {figurinha.titulo}
            </h3>
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-1.5 py-0.5 rounded text-[10px] bg-gold-500/5 text-gold-300 border border-gold-500/10"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Price */}
          <div className="flex items-center gap-2">
            {figurinha.preco ? (
              <span className="text-gold-400 font-bold text-sm">
                {formatPrice(figurinha.preco)}
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-lg bg-gold-500/5 text-gold-400 text-xs border border-gold-500/15">
                Valor sob Consulta
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
