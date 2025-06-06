import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      isSystemAdmin?: boolean;
      authType?: string;
    }
  }

  interface User {
    isSystemAdmin?: boolean;
    authType?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    isSystemAdmin?: boolean;
    authType?: string;
  }
} 