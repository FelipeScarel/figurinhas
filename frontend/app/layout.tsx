import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Figurinhas Adesivas 3D — Personalizados para Capacete e Moto",
  description:
    "Adesivos personalizados de alta qualidade para capacetes, motos e notebooks. Visualize em 3D, escolha seu modelo e peça pelo WhatsApp.",
  keywords: [
    "adesivos personalizados",
    "figurinhas capacete",
    "adesivos moto",
    "stickers personalizados",
  ],
  openGraph: {
    title: "Figurinhas Adesivas 3D",
    description: "Visualize em 3D antes de comprar",
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
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
