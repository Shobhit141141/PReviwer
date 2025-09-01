import type { Metadata } from "next";
import { Ubuntu } from "next/font/google";

import "./globals.css";
import { ThemeProvider } from "@/components/ui/theme-povider";
import { AuthProvider } from "@/contexts/AuthContext";
import Navbar from "@/components/navbar";
import { Toaster } from "react-hot-toast";
import Script from "next/script";


const getUbuntu = Ubuntu({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-ubuntu",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PReviewer",
  description: "AI-powered PR review system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=G-BL44GTJHK5`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-BL44GTJHK5');
          `}
        </Script>
      </head>
      <body
        className={`${getUbuntu.className} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >

          <Toaster />
          <AuthProvider>
            <Navbar />
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
