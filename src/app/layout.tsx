import type { Metadata } from "next";
import Image from "next/image";
import { Plus_Jakarta_Sans, Spline_Sans_Mono } from "next/font/google";
import { getTheme, resolveTheme } from "@/lib/theme/server";
import { ThemeProvider } from "@/lib/theme/client";
import "./globals.css";

const THEME_INIT_SCRIPT = `(function(){try{var p=document.documentElement.getAttribute("data-theme-pref");function resolve(p){if(p==="system"||!p){return window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}return p}document.documentElement.setAttribute("data-theme",resolve(p));if(p==="system"){window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change",function(e){if(document.documentElement.getAttribute("data-theme-pref")==="system"){document.documentElement.setAttribute("data-theme",e.matches?"dark":"light")}})}}catch(e){}})();`;

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const splineMono = Spline_Sans_Mono({
  variable: "--font-spline-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "trasso",
  description:
    "Create SAT and AP STEM tests and problem sets in PDF, with questions, LaTeX equations, and a custom layout.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const theme = await getTheme();

  return (
    <html
      lang="en"
      data-theme={resolveTheme(theme)}
      data-theme-pref={theme}
      suppressHydrationWarning
      className={`${plusJakarta.variable} ${splineMono.variable} h-full`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col font-sans antialiased">
        <ThemeProvider theme={theme}>{children}</ThemeProvider>
        <Image
          src="/trasso-logo.svg"
          alt=""
          width={28}
          height={28}
          aria-hidden="true"
          className="pointer-events-none fixed bottom-3 right-3 z-[999] h-7 w-7 opacity-30 print:hidden"
        />
      </body>
    </html>
  );
}
