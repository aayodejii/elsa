import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Elsa — AI Photo Editor",
  description: "Free, browser-based AI portrait retouching. Background removal, skin retouching, face enhancement and more.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full overflow-hidden">{children}</body>
    </html>
  );
}
