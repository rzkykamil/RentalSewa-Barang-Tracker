import type { DefaultSession } from "next-auth";
import type { UserRole } from "@/generated/prisma/enums";

/**
 * Module augmentation for NextAuth (Auth.js) v4 types — adds `id` and `role`
 * to the JWT payload and session object, mirroring the `users` table role
 * enum. See docs/flows/auth-permission-flow.md §1.
 */
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: UserRole;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
  }
}
