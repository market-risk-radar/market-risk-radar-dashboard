import type { Metadata } from 'next';
import { IBM_Plex_Mono, Space_Grotesk } from 'next/font/google';
import { headers } from 'next/headers';
import './globals.css';
import Navigation from '@/components/Navigation';
import SessionProviderWrapper from '@/components/SessionProviderWrapper';

// /login, /pending 페이지에는 사이드바 없음
// (미들웨어가 x-pathname 헤더를 주입 → layout에서 읽음)
const AUTH_PATHS = new Set(['/login', '/pending']);

const bodySans = Space_Grotesk({
  variable: '--font-body-sans',
  subsets: ['latin'],
});
const bodyMono = IBM_Plex_Mono({
  variable: '--font-body-mono',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
});

export const metadata: Metadata = {
  title: 'Market Risk Radar',
  description: 'Portfolio monitoring dashboard',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  // 미들웨어가 모든 NextResponse.next() 응답에 x-pathname 헤더를 주입
  const pathname = headersList.get('x-pathname') ?? '';
  const isAuthPage = AUTH_PATHS.has(pathname);

  return (
    <html lang="ko" className={`${bodySans.variable} ${bodyMono.variable} h-full antialiased`}>
      <body className="dashboard-shell h-full text-white">
        <SessionProviderWrapper>
          <div className="pointer-events-none fixed inset-0 overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(241,103,37,0.16),_transparent_28%),radial-gradient(circle_at_75%_10%,_rgba(74,222,128,0.10),_transparent_22%),linear-gradient(180deg,_rgba(9,12,16,0.94),_rgba(7,10,14,1))]" />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/14 to-transparent" />
            <div className="absolute left-[18%] top-24 h-56 w-56 rounded-full bg-orange-500/8 blur-3xl" />
            <div className="absolute right-[12%] top-40 h-72 w-72 rounded-full bg-emerald-400/6 blur-3xl" />
          </div>
          {!isAuthPage && <Navigation />}
          <main className={`relative min-h-screen p-4 md:p-8 pt-18 ${isAuthPage ? '' : 'md:ml-64 md:pt-8'}`}>
            <div className="mx-auto max-w-[1440px]">{children}</div>
          </main>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
