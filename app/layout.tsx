import type { Metadata } from "next";
import "./globals.css";
import { WalletProvider } from "@/context/WalletContext";
import { Navbar } from "@/components/layout/Navbar";

export const metadata: Metadata = {
  title: "LiquiVault | Institutional B2B Invoice Factoring on Stellar Soroban",
  description:
    "Decentralized Real-World Asset (RWA) trade receivables factoring, algorithmic discount pricing, and atomic escrow settlement on Stellar Soroban.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-slate-950 bg-institutional-grid text-slate-100 flex flex-col">
        <WalletProvider>
          <Navbar />
          <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            {children}
          </main>
          <footer className="border-t border-slate-800/80 bg-slate-950/90 py-6 text-xs text-slate-500">
            <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-center justify-between px-4 sm:px-6 lg:px-8 gap-4">
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-slate-300">LiquiVault Protocol</span>
                <span>•</span>
                <span>Powered by Stellar Soroban Smart Contracts (SEP-41, SEP-10, SEP-24)</span>
              </div>
              <div className="font-mono text-slate-400">
                Network: Test SDF Network ; September 2015
              </div>
            </div>
          </footer>
        </WalletProvider>
      </body>
    </html>
  );
}
