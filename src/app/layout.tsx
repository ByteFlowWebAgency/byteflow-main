import './globals.css';
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-jakarta',
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata = {
  title: 'ByteFlow Solutions — senior engineering, delivered beautifully.',
  description:
    'Enterprise software, custom development, and AI integration for teams that care how things are built. Partner with senior engineers from first sketch to production.',
};

// Root shell only: html/body + the shared font variables. The marketing chrome
// (Contentful-driven Nav/Footer) lives in the (site) route group's layout, and the
// internal tools get their own chrome in internal/(protected)/layout — so /internal no
// longer depends on Contentful or inherits the marketing pill Nav.
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${jakarta.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
