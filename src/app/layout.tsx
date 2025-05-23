import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { OrgConfigProvider } from "@/components/org-config-provider";
import { BodyContent } from "@/components/body-content";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

// Metadata will be overridden by dynamic metadata in the app
export const metadata: Metadata = {
  title: "Frigg | Tecelã de Estratégias",
  description:
    "Inspirado na deusa nórdica que tece o destino, Frigg mapeia e visualiza conexões estratégicas para tomada de decisões.",
  authors: [{ name: "FIEAC" }],
  keywords: [
    "Frigg",
    "Visualização de Conexões",
    "Análise Estratégica",
    "Mitologia Nórdica",
    "Tecelã de Estratégias",
    "FIEAC",
    "Neo4j",
  ],
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-screen font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <OrgConfigProvider>
            <BodyContent>
              {children}
            </BodyContent>
            <Toaster richColors closeButton position="top-right" />
          </OrgConfigProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
