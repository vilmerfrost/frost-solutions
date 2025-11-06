import type { Metadata, Viewport } from "next";
import "./globals.css";
import { TenantProvider } from "@/context/TenantContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { QueryProvider } from "@/providers/QueryProvider";
import Toaster from "@/components/Toaster";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import { SafeSyncComponents } from "@/components/SafeSyncComponents";
import { SyncInitializer } from "@/components/SyncInitializer";
import AIChatbotClient from "@/components/ai/AIChatbotClient";

// INTE "use client"! Ingen useEffect här!

export const metadata: Metadata = {
  title: "Frost Solutions",
  description: "Tidsrapportering & fakturering för bygg – Frost Solutions",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0ea5e9",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv" style={{ overflow: 'visible' }}>
      <body className="min-h-screen bg-background text-foreground antialiased" style={{ overflow: 'visible', position: 'relative' }}>
        <ErrorBoundary>
          <QueryProvider>
            <ThemeProvider>
              <TenantProvider>
                <ErrorBoundary fallback={null}>
                  <SyncInitializer />
                </ErrorBoundary>
                <SafeSyncComponents />
                {children}
                <Toaster />
                <ServiceWorkerRegister />
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <AIChatbotClient />
                </div>
              </TenantProvider>
            </ThemeProvider>
          </QueryProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
