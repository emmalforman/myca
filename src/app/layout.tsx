import type { Metadata } from "next";
import "./globals.css";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import TrialBanner from "@/components/TrialBanner";

export const metadata: Metadata = {
  title: {
    default: "Myca Collective | The Inner Circle of Food & CPG",
    template: "%s | Myca Collective",
  },
  description:
    "A members-only collective for founders, operators, and investors in food and consumer goods. Connect with 250+ vetted professionals across NYC, SF, LA, London, and Chicago.",
  keywords: [
    "food community",
    "CPG network",
    "food founders",
    "food investors",
    "food operators",
    "CPG collective",
    "food industry networking",
    "consumer goods community",
    "food startup network",
    "food and beverage professionals",
  ],
  openGraph: {
    title: "Myca Collective | The Inner Circle of Food & CPG",
    description:
      "A members-only collective for founders, operators, and investors building the future of food and consumer goods.",
    type: "website",
    locale: "en_US",
    siteName: "Myca Collective",
  },
  twitter: {
    card: "summary_large_image",
    title: "Myca Collective",
    description:
      "The inner circle of food & CPG. 250+ founders, operators, and investors.",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://mycacollective.com",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Myca Collective",
              description:
                "A members-only collective for founders, operators, and investors in food and consumer goods.",
              url: "https://mycacollective.com",
              foundingDate: "2024",
              areaServed: [
                "New York",
                "San Francisco",
                "Los Angeles",
                "London",
                "Chicago",
              ],
              memberOf: {
                "@type": "ProgramMembership",
                programName: "Myca Collective Membership",
                membershipNumber: "250+",
              },
            }),
          }}
        />
      </head>
      <body className="font-sans min-h-screen flex flex-col">
        <Navigation />
        <TrialBanner />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
