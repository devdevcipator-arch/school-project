import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Plus_Jakarta_Sans } from "next/font/google";
import RevealObserver from "@/components/motion/RevealObserver";
import PickerOnClick from "@/components/ui/PickerOnClick";
import { site } from "@/lib/site";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const revealBootstrap =
  "var d=document.documentElement;d.classList.add('js');setTimeout(function(){if(!d.classList.contains('reveal-ready'))d.classList.remove('js')},4000)";

export const metadata: Metadata = {
  title: `${site.name} | Paperless School Management with AI`,
  description: site.description,
};

export const viewport: Viewport = {
  themeColor: "#061E29",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${jakarta.variable} antialiased`} suppressHydrationWarning>
      <head>
        {/* Enables reveal animations only when JS runs. Failsafe: if the observer never starts, show everything. */}
        <script dangerouslySetInnerHTML={{ __html: revealBootstrap }} />
      </head>
      <body className="bg-surface font-sans leading-relaxed text-ink">
        {children}
        <Suspense fallback={null}>
          <RevealObserver />
        </Suspense>
        <PickerOnClick />
      </body>
    </html>
  );
}
