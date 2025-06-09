import 'express-session';

declare module 'express-session' {
  interface SessionData {
    oauthSessionId?: string;
    oauth?: any; // Using any to avoid circular import issues
  }
} 