import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ThemeProvider from "@/components/theme-provider";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

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
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className="scroll-smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen w-screen max-w-full font-sans antialiased overflow-x-hidden`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SidebarProvider defaultOpen={false}>
            <div className="flex h-screen w-full overflow-hidden bg-background relative">
              <AppSidebar className="z-50" />

              <SidebarInset className="flex flex-col flex-1 w-full">
                <SiteHeader />
                <main className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950">
                  <div className="w-full max-w-full">{children}</div>
                </main>
              </SidebarInset>
            </div>
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
