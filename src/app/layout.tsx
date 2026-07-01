import type { Metadata, Viewport } from 'next';
import { Noto_Sans_KR } from 'next/font/google'
import { cn } from '@/lib/utils';
import ServiceWorkerRegistrar from '@/components/pwa/ServiceWorkerRegistrar';
import './globals.css';

const notoSans = Noto_Sans_KR({ 
  subsets: ['latin'],
  display: 'swap', 
})

export const metadata: Metadata = {
  title: 'LKC',
  description: '뜨개 차트를 간단하게 그리자 | Make knitting chart lightly',
  keywords: "뜨개질,도안,대바늘,배색,차트,드로잉,픽셀",
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'LKC',
  },
  applicationName: 'LKC',
  icons: {
    shortcut: { url: '/favicon.ico', type: 'image/x-icon', sizes: '16x16' },
    icon: { url: '/icon.png', type: 'image/png', sizes: '32x32' },
    apple: { url: '/apple-icon.png', type: 'image/png', sizes: '180x180' }
  }
}

export const viewport: Viewport = {
  themeColor: '#00bcff',
  maximumScale: 1,
  userScalable: false,
  colorScheme: 'only light',
};

export default function RootLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal?: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={cn('h-full', 'antialiased', 'font-sans', notoSans.className)}>
      <body className="flex min-h-full flex-col">
        <ServiceWorkerRegistrar />
        <div className="h-screen w-full overflow-hidden text-sm">
          {children}
          {modal}
        </div>
      </body>
    </html>
  );
}
