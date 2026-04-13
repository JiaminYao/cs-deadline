import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { DisplayTimezoneProvider } from "@/contexts/DisplayTimezoneContext";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CS Conference Deadlines",
  description:
    "Track computer science conference deadlines for top-ranked venues. Featuring CORE A*/A and CSRankings conferences with AoE timezone support.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <DisplayTimezoneProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
              <Header />
              <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-8">
                {children}
              </main>
              <Footer />
            </div>
          </ThemeProvider>
        </DisplayTimezoneProvider>
      </body>
    </html>
  );
}
