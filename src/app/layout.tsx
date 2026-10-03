import type { Metadata, Viewport } from "next";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import PwaRegistrar from "@/components/PwaRegistrar";

export const metadata: Metadata = {
  title: {
    default: "LocalLoop — Travel local. Spend local. Keep the value local.",
    template: "%s · LocalLoop",
  },
  description:
    "Discover the small businesses, people and places that make every destination unique — and see where your tourism money keeps the most value local.",
  applicationName: "LocalLoop",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: { capable: true, title: "LocalLoop", statusBarStyle: "default" },
  openGraph: {
    title: "LocalLoop",
    description: "Travel local. Spend local. Keep the value local.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#c4552b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-white"
        >
          Skip to content
        </a>

        <header className="sticky top-0 z-30 border-b border-line/80 bg-cream/90 backdrop-blur">
          <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
            <a href="/" className="flex items-center gap-2">
              <span aria-hidden className="grid h-8 w-8 place-items-center rounded-full bg-clay text-sm text-white">
                ◍
              </span>
              <span className="font-display text-lg font-semibold tracking-tight">LocalLoop</span>
            </a>
            <div className="flex items-center gap-2">
              <span className="ll-chip border-honey/40 bg-honey-soft text-[0.7rem] text-ink/70">DEMO DATA</span>
              <a href="/admin" className="ll-chip hover:border-clay hover:text-clay">
                Admin
              </a>
            </div>
          </div>
        </header>

        <main id="main" className="mx-auto max-w-3xl px-4 pb-28 pt-4">
          {children}
        </main>

        <footer className="mx-auto max-w-3xl px-4 pb-28 text-xs leading-relaxed text-muted">
          <p className="mb-1">
            <strong className="font-semibold text-ink">LocalLoop</strong> is a working MVP. All businesses shown are
            fictional demo listings for the invented destination of Riverstone — they are not real businesses.
          </p>
          <p>
            Local Score is a transparent heuristic, not a scientific measure. Spending and impact figures are
            estimates unless they come from an actual transaction.
          </p>
        </footer>

        <BottomNav />
        <PwaRegistrar />
      </body>
    </html>
  );
}