import "./globals.css";

export const metadata = {
  title: "PerfectPartner.AI - Rishta Scanner",
  description:
    "Instagram daalo. Scan karo. Shaadi karo ya bhago. A playful rishta scanner built with Next.js."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-desi-pattern font-body text-charcoal">{children}</body>
    </html>
  );
}
