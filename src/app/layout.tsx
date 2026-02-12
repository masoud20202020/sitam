
import type { Metadata } from "next";
import { Vazirmatn } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { CartDrawer } from "@/components/CartDrawer";
import { SEOMetadataUpdater } from "@/components/SEOMetadataUpdater";
import ChatWidget from "@/components/chat/ChatWidget";
import { getSiteSettings } from "@/app/actions/settings";

const vazirmatn = Vazirmatn({
  subsets: ["arabic", "latin"],
  variable: "--font-vazirmatn",
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const baseUrl = settings.baseUrl || "http://localhost:3000";

  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: settings.seoTitle || settings.brandName || "فروشگاه آنلاین شیک",
      template: `%s | ${settings.brandName || "فروشگاه آنلاین شیک"}`,
    },
    description: settings.seoDescription || "بهترین محصولات با بهترین قیمت",
    openGraph: {
      title: settings.seoTitle || settings.brandName || "فروشگاه آنلاین شیک",
      description: settings.seoDescription || "بهترین محصولات با بهترین قیمت",
      type: "website",
      siteName: settings.brandName || "فروشگاه آنلاین شیک",
      locale: "fa_IR",
    },
    robots: {
      index: true,
      follow: true,
    },
    verification: {
      google: settings.googleSiteVerification,
      other: {
        "msvalidate.01": settings.bingSiteVerification || "",
      },
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getSiteSettings();

  return (
    <html lang="fa" dir="rtl">
      <body
        className={`${vazirmatn.variable} font-sans antialiased`}
      >
        <SEOMetadataUpdater settings={settings} />
        <CartProvider>
          <CartDrawer />
          <WishlistProvider>
            {children}
            <ChatWidget />
          </WishlistProvider>
        </CartProvider>
      </body>
    </html>
  );
}
