import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Figurinhas Premium — Adesivos de Luxo Personalizados",
  description:
    "Adesivos premium de alta qualidade com acabamentos exclusivos: brilhante, fosco acetinado, refletivo e holográfico. Design de luxo para sua marca, veículo ou projeto.",
  keywords: [
    "adesivos premium",
    "stickers personalizados",
    "vinil de luxo",
    "adesivos holográficos",
    "figurinhas personalizadas",
    "acabamento premium",
  ],
  openGraph: {
    title: "Figurinhas Premium — Adesivos de Luxo",
    description: "Transforme superfícies em arte com adesivos premium personalizados",
    type: "website",
    locale: "pt_BR",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark scroll-smooth">
      <body className={`${inter.variable} ${playfair.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
