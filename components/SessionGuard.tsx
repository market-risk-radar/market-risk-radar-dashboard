'use client';

import { useEffect, useRef } from 'react';
import { signOut } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';

const AUTH_PATHS = new Set(['/login', '/pending']);
const HEARTBEAT_MS = 30_000;

export default function SessionGuard() {
  const pathname = usePathname();
  const router = useRouter();
  const signingOutRef = useRef(false);

  useEffect(() => {
    if (!pathname || AUTH_PATHS.has(pathname)) return;

    async function forceLogout() {
      if (signingOutRef.current) return;
      signingOutRef.current = true;

      try {
        await signOut({ redirect: false });
      } finally {
        router.replace('/login?error=session_replaced');
        router.refresh();
      }
    }

    async function checkSession() {
      try {
        const res = await fetch('/api/auth/validate', {
          method: 'GET',
          cache: 'no-store',
          credentials: 'same-origin',
        });

        if (res.status === 401 || res.status === 403) {
          await forceLogout();
        }
      } catch {
        // 네트워크/백엔드 일시 오류는 세션 유지
      }
    }

    void checkSession();

    const intervalId = window.setInterval(() => {
      void checkSession();
    }, HEARTBEAT_MS);

    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        void checkSession();
      }
    }

    window.addEventListener('focus', handleVisibilityChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleVisibilityChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [pathname, router]);

  return null;
}
