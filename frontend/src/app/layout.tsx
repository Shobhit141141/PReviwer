import type { Metadata } from "next";
import { Ubuntu} from "next/font/google";

import "./globals.css";
import { ThemeProvider } from "@/components/ui/theme-povider";
import { AuthProvider } from "@/contexts/AuthContext";
import Navbar from "@/components/navbar";


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
      <body
       className={`${getUbuntu.className} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <Navbar />
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
