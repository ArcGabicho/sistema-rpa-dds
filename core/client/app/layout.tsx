import type { Metadata } from "next";
import { Instrument_Sans, Roboto_Mono } from "next/font/google";
import { Toaster } from "sileo";
import "./globals.css";

const instrumentSans = Instrument_Sans({
  variable: "--font-instrument-sans",
  subsets: ["latin"],
  weight: "variable",
});

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
  weight: "variable",
});

export const metadata: Metadata = {
  title: "Data Discovery Solutions | Analítica, RPA e IA",
  description:
    "Soluciones inteligentes en Analítica de Datos, Automatización RPA e Inteligencia Artificial para transformar tu empresa.",
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${instrumentSans.variable} ${robotoMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-paper font-sans text-ink-950">
        {children}
        <Toaster position="top-right" theme="light" options={{ roundness: 16 }} />
      </body>
    </html>
  );
}
