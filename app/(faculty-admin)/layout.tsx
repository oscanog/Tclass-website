import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AdminCsvImportProvider } from "@/components/admin/csv-import-provider";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TClass - Faculty & Admin Portal",
  description: "TClass Faculty and Administration Portal",
};

export default function FacultyAdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      <AdminCsvImportProvider>{children}</AdminCsvImportProvider>
    </div>
  );
}
