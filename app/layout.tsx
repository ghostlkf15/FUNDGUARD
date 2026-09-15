import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { PagePreloader } from "@/components/ui/page-preloader";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL
      ? String(process.env.NEXT_PUBLIC_SITE_URL).replace(/\/$/, "") + "/"
      : "https://fundguard.app/"
  ),
  title: {
    default: "FUNDGUARD · Suite prop firms · MT5 + cTrader + APIs Crypto",
    template: "%s | FUNDGUARD",
  },
  description:
    "FUNDGUARD es la suite institucional para traders de prop firm. Pasa desafíos con reglas reales PDF, alertas 80% antes de límites, dashboard cinematográfico, conexión EA MT5, cBot cTrader y APIs Cripto AES-256. Sin tarjeta · Sin KYC.",
  keywords: [
    "prop firm", "prop firm challenge", "challenge trader", "desafio de fondeo",
    "forex", "futuros", "crypto", "sinteticos", "trading",
    "FTMO", "Apex", "Bullsy", "FX Live Capital", "FXLC", "City Traders", "MyForexFunds",
    "drawdown", "daily drawdown", "max drawdown", "reglas del desafio", "profit split",
    "EA MT5", "MetaTrader 5", "cBot cTrader", "Bybit API", "Binance API",
    "RLS seguridad", "AES-256-GCM", "bcrypt report key",
    "fundguard", "suite prop trading", "dashboard de trading",
  ],
  applicationName: "FUNDGUARD",
  category: "finance",
  creator: "TKECH",
  publisher: "FUNDGUARD",
  authors: [{ name: "TKECH", url: "https://tkech.dev" }],
  alternates: {
    canonical: "/",
    languages: {
      "es-ES": "/",
      "es-LA": "/",
      "en-US": "/",
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    siteName: "FUNDGUARD",
    title: "FUNDGUARD · Suite prop firms · MT5 + cTrader + APIs Crypto",
    description:
      "Pasa desafíos de prop firm con reglas reales PDF. Alertas 80% antes de límites. Conexión segura EA MT5, cBot cTrader y APIs Cripto AES-256. Sin tarjeta · Sin KYC.",
    url: "/",
    locale: "es_ES",
    alternateLocale: ["es_LA", "en_US"],
    images: [
      {
        url: "/og-cover.svg",
        width: 1200,
        height: 630,
        alt: "FUNDGUARD · Suite prop firms · MT5 cTrader APIs Crypto · Reglas PDF oficiales",
        type: "image/svg+xml",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@fundguard",
    creator: "@fundguard",
    title: "FUNDGUARD · Suite prop firms · MT5 + cTrader + APIs Crypto",
    description:
      "Reglas PDF oficiales · Alertas 80% antes de límites · Conexión EA MT5 segura. Sin tarjeta · Sin KYC.",
    images: [
      {
        url: "/og-cover.svg",
        width: 1200,
        height: 630,
        alt: "FUNDGUARD OG cover",
      },
    ],
  },
  appLinks: {
    web: {
      url: "/",
      should_fallback: true,
    },
  },
  appleWebApp: {
    capable: true,
    title: "FUNDGUARD",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/favicon.svg" }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <PagePreloader />
          {children}
          <Toaster
            theme="dark"
            richColors
            closeButton
            position="top-right"
            toastOptions={{
              classNames: {
                toast:
                  "!bg-card/90 !backdrop-blur-xl !border-gold-500/20 !text-foreground",
                success:
                  "!bg-emerald-500/10 !border-emerald-400/30 !text-emerald-200",
                error:
                  "!bg-rose-500/10 !border-rose-400/30 !text-rose-200",
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
