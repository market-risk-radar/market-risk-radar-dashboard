import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session extends DefaultSession {
    authStatus?: string; // APPROVED | PENDING | BLOCKED | ERROR
    userId?: string;
    role?: string;       // USER | ADMIN
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    authStatus?: string;
    sessionId?: string;  // Redis 세션 키 (서버사이드 전용, 클라이언트에 미노출)
    userId?: string;
    role?: string;
  }
}
