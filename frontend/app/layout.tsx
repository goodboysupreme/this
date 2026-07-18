import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/components/auth-provider";
import { AnalyticsTracker } from "@/components/analytics-tracker";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk" });

export const metadata: Metadata = {
  title: {
    default: "PlaceIQ — BITS Pilani Placement & PS Intelligence",
    template: "%s | PlaceIQ",
  },
  description:
    "One stop. Every offer. Placement, PS-1, PS-2 and SI intelligence for BITS Pilani — cutoffs, stats, predictors and experiences.",
  keywords: [
    "BITS Pilani",
    "placements",
    "PS-1",
    "PS-2",
    "summer internships",
    "CGPA cutoff",
    "placement stats",
    "interview experiences",
    "PlaceIQ",
  ],
  openGraph: {
    type: "website",
    siteName: "PlaceIQ",
    title: "PlaceIQ — BITS Pilani Placement & PS Intelligence",
    description:
      "One stop. Every offer. Placement, PS-1, PS-2 and SI intelligence for BITS Pilani — cutoffs, stats, predictors and experiences.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${spaceGrotesk.variable} page-glow font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <AuthProvider>
            <div className="flex min-h-screen flex-col">
              <Navbar />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
            <AnalyticsTracker />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
