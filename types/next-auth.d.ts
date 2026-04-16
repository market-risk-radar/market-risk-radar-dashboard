import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session extends DefaultSession {
    authStatus?: string;  // APPROVED | PENDING | BLOCKED | ERROR
    userId?: string;
    role?: string;        // USER | ADMIN
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    authStatus?: string;
    refreshToken?: string;
    userId?: string;
    role?: string;
    checkedAt?: number;   // 마지막 백엔드 체크 시각 (ms)
  }
}
