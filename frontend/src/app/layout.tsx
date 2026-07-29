import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "@/context/ThemeContext";
import AuthInitializer from "@/components/AuthInitializer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "XY Hotel - Luxury Hotel in Addis Ababa, Ethiopia",
  description: "Experience world-class luxury at XY Hotel. Book your stay in the heart of Addis Ababa, Ethiopia.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <AuthInitializer>
            <Toaster position="top-right" />
            {children}
          </AuthInitializer>
        </ThemeProvider>
      </body>
    </html>
  );
}
