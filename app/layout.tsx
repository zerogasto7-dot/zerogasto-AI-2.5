import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from '@vercel/analytics/react';
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Configuración de Metadata (Sin themeColor aquí)
export const metadata = {
  title: 'ZeroGasto 2.5 - Recetas Inteligentes con IA',
  description: 'Ahorra dinero y evita gastos extra. Genera recetas mágicas con los ingredientes que tienes en casa usando Inteligencia Artificial.',
  keywords: ['recetas con ingredientes en casa', 'ahorro cocina', 'inteligencia artificial cocina', 'ZeroGasto', 'plan elite'],
  openGraph: {
    title: 'ZeroGasto 2.5',
    description: '¡Deja de tirar comida! Sube una foto de tu refri y cocina algo increíble hoy.',
    type: 'website',
  },
};

// Nueva exportación Viewport (Esto quita los avisos de Vercel)
export const viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Analytics /> {/* 👉 AQUÍ ES DONDE VA ✨ */}
      </body>
    </html>
  );
}