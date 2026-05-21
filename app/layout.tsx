import type { Metadata } from "next";
import { DM_Sans, Geist } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "ArogyaMaarga",
  description:
    "AI-powered patient intake and hospital routing for modern healthcare operations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", dmSans.variable, "font-sans", geist.variable)}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-background text-foreground font-sans transition-colors duration-300">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
