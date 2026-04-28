import type { Metadata, Viewport } from 'next';
import { Noto_Sans_KR } from 'next/font/google'
import { cn } from '@/lib/utils';
import './globals.css';

const notoSans = Noto_Sans_KR({ 
  subsets: ['latin'],
  display: 'swap', 
})

export const metadata: Metadata = {
  title: 'LKC',
  description: '뜨개 차트를 간단하게 그리자 | Make knitting chart lightly',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'LKC',
  },
}

export const viewport: Viewport = {
  themeColor: '#00bcff',
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
        <div className="h-screen w-full overflow-hidden text-sm">
          {children}
          {modal}
        </div>
      </body>
    </html>
  );
}
