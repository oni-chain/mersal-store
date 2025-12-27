import type { Metadata } from "next";
import { Inter, Cairo } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/context/LanguageContext";
import Cart from "@/components/Cart";
import AddToCartModal from "@/components/AddToCartModal";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Mersal | وجهتك لأفضل ماوس باد",
  description: "ارخص الاسعار وافضل خدمه ممكن تحصلها",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${cairo.variable}`}>
      <body className={`${inter.className} antialiased`}>
        <LanguageProvider>
          {children}
          <Cart />
          <AddToCartModal />
        </LanguageProvider>
      </body>
    </html>
  );
}
