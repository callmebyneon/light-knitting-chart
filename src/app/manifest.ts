import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Light Knitting Chart',
    short_name: 'LKC',
    description: '뜨개 차트를 간단하게 그리자 | Make knitting chart lightly',
    id: '/',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#00bcff',
    icons: [
      {
        src: '/icons/android-icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/android-icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-32.png',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        src: '/icons/icon-16.png',
        sizes: '16x16',
        type: 'image/png',
      },
      {
        src: '/icons/apple-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
      {
        src: '/icons/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  };
}
