import type { Metadata } from "next";
import { headers } from "next/headers";
import { Plus_Jakarta_Sans, Spline_Sans_Mono, Source_Serif_4 } from "next/font/google";
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

// Print-only body serif: trialed for exam body/passage text, where teachers
// expect the serif convention set by official exam papers (ENEM, AP, SAT).
const sourceSerif = Source_Serif_4({
  variable: "--font-print-serif",
  subsets: ["latin"],
  weight: ["400", "600"],
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
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <html
      lang="en"
      data-theme={resolveTheme(theme)}
      data-theme-pref={theme}
      suppressHydrationWarning
      className={`${plusJakarta.variable} ${splineMono.variable} ${sourceSerif.variable} h-full`}
    >
      <head>
        {/* suppressHydrationWarning: browsers censor the `nonce` content attribute
            after parsing (it's only exposed via the IDL property), so the client
            always reads nonce="" and hydration flags a false mismatch. */}
        <script nonce={nonce} suppressHydrationWarning dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col font-sans antialiased">
        <ThemeProvider theme={theme}>{children}</ThemeProvider>
      </body>
    </html>
  );
}
