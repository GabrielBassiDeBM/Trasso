import type { Metadata } from "next";
import Image from "next/image";
import { Plus_Jakarta_Sans, Spline_Sans_Mono } from "next/font/google";
import "./globals.css";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${plusJakarta.variable} ${splineMono.variable} h-full`}>
      <body className="min-h-full flex flex-col font-sans antialiased">
        {children}
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
