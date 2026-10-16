import type { Metadata } from "next";
import { Instrument_Sans, Roboto_Mono } from "next/font/google";
import { Toaster } from "sileo";
import { DEFAULT_DESCRIPTION, DEFAULT_TITLE, getSiteUrl, socialMetadata } from "@/lib/metadata";
import { SITE } from "@/lib/site-config";
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

// Defaults for every route. No canonical or og:url here: routes that don't
// set their own (the panel) would otherwise claim to be the home page.
export const metadata: Metadata = {
  metadataBase: getSiteUrl(),
  title: DEFAULT_TITLE,
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE.name,
  ...socialMetadata({ title: DEFAULT_TITLE, description: DEFAULT_DESCRIPTION }),
  icons: {
    icon: "/assets/icon.png",
    apple: "/assets/apple-icon.png",
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
      <body className="min-h-full flex flex-col bg-white font-sans text-ink-950">
        {children}
        <Toaster position="top-right" theme="light" options={{ roundness: 16 }} />
      </body>
    </html>
  );
}
