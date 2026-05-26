import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SkyView — Weather App',
  description: 'Real-time weather with live location detection',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
