import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NCERT One Stop",
  description: "NCERT notes, summaries and question answers."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
