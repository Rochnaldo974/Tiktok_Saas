import type { Metadata, Viewport } from 'next';
import { Bricolage_Grotesque, Inter, JetBrains_Mono } from 'next/font/google';
import { Toaster } from '@/components/toaster';
import './globals.css';

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-bricolage',
  weight: ['700', '800'],
});
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});
const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  weight: ['400', '500', '600'],
});

export const metadata: Metadata = {
  title: {
    default: 'Signal — TikTok intelligence',
    template: '%s · Signal',
  },
  description:
    'Signal scans TikTok trends by country and surfaces the videos, sounds, hooks and creators worth acting on today.',
  applicationName: 'Signal',
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#09090b',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${bricolage.variable} ${inter.variable} ${jetbrains.variable}`}>
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
