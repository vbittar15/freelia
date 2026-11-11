import type { Metadata, Viewport } from "next";
import { SWRegister } from "@/components/pwa";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Freelia", template: "%s · Freelia" },
  description: "El espacio de trabajo para freelancers creativos y sus clientes.",
  applicationName: "Freelia",
  appleWebApp: { capable: true, title: "Freelia", statusBarStyle: "default" },
  icons: { apple: "/apple-touch-icon.png" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = { themeColor: "#FFFFFF", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}<SWRegister /></body>
    </html>
  );
}
