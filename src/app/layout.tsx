import type { Metadata } from "next";
import { GeistSans, GeistMono } from "geist/font";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AppShell } from "@/components/AppShell";

export const metadata: Metadata = {
  title: "AgencyGrid — Visibilidad 360° para tu agencia",
  description: "AgencyGrid — Web App para agencias de publicidad",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var t = localStorage.getItem("agencygrid-theme");
                  if (t !== "light" && t !== "dark") t = "dark";
                  document.documentElement.setAttribute("data-theme", t);
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased" style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}>
        <ThemeProvider>
          <AppShell>{children}</AppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
