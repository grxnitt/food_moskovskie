import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Перемена — поесть между парами",
  description: "Что поесть у Московских ворот: блюда, бюджет и отзывы студентов в радиусе двух километров. Санкт-Петербург.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className="antialiased">{children}</body>
    </html>
  );
}
