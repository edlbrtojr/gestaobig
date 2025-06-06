import type { Metadata, Viewport } from "next";
import { Inter, Cinzel_Decorative } from "next/font/google";
import "./globals.css";
import { BodyContent } from "@/components/body-content";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";
import { OrgConfigProvider } from "@/contexts/org-config-provider";
import { AuthProviders } from "@/components/auth/auth-providers";
import { TransitionProvider } from "@/components/providers/transition-provider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

// Fonte estilo nórdico/medieval para títulos especiais
const cinzelDecorative = Cinzel_Decorative({
  weight: ["400", "700", "900"],
  subsets: ["latin"],
  variable: "--font-nordic",
});

// Metadata will be overridden by dynamic metadata in the app
export const metadata: Metadata = {
  title: "Frigg - Tecelã de Estratégias",
  description: "Visualize conexões estratégicas e revele padrões ocultos com o Frigg",
  authors: [{ name: "FIEAC" }],
  keywords: [
    "FIEAC",
    "Frigg",
    "Estratégia",
    "Visualização",
    "Grafo",
    "Redes",
    "Conexões",
  ],
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
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
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`antialiased ${inter.variable} ${cinzelDecorative.variable} theme-transition`}
    >
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body
        className={`${inter.variable} min-h-screen font-sans antialiased`}
      >
        <AuthProviders>
        <OrgConfigProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <BodyContent>
              <TransitionProvider>
                {children}
              </TransitionProvider>
            </BodyContent>
            <Toaster richColors closeButton position="top-right" />
          </ThemeProvider>
        </OrgConfigProvider>
        </AuthProviders>
      </body>
    </html>
  );
}
