import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import HuddleContextProvider from "@/context/HuddleContextProvider";
import { Suspense } from "react";
import ProgressBarProvider from "@/components/ProgressBarProvider/ProgressBarProvider";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ProgressBarProvider>
          <Suspense>
            <HuddleContextProvider>{children}</HuddleContextProvider>
          </Suspense>
        </ProgressBarProvider>
      </body>
    </html>
  );
}
