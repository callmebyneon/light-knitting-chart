import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Light Knitting Chart',
    short_name: 'LKC',
    description: '뜨개 차트를 간단하게 그리자 | Make knitting chart lightly',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#00bcff',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
      {
        src: '/icon.png',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        src: '/apple-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  };
}
