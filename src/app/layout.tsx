import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Myca | Member Directory",
  description:
    "Discover, connect, and collaborate with community members. Your hub for outreach and group creation.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans">{children}</body>
    </html>
  );
}
