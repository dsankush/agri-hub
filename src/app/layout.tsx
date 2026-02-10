import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AgriHub - Agricultural Product Knowledge Hub',
  description: 'Discover agricultural products, crop protection solutions, fertilizers, and agri-inputs from top companies across India.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
