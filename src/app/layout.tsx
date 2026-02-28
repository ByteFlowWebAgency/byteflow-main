import './globals.css';
import { Metadata } from 'next';
import Navbar from '@/components/Navbar/Navbar';
import Footer from '@/components/Footer/Footer';

export const metadata: Metadata = {
  title: {
    default: 'BYTEFLOW | Intelligent Technology Solutions',
    template: '%s | BYTEFLOW',
  },
  description:
    'BYTEFLOW partners with organizations to design, build, and deploy enterprise-grade technology — from AI integration to cloud infrastructure — with precision and speed.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
