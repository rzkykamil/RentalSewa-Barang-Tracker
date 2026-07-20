import type { Metadata } from "next";
import Link from "next/link";

import { AuthCard } from "@/components/auth/AuthCard";
import { LoginForm } from "@/components/auth/LoginForm";
import { loginCopy } from "@/lib/copy/auth";

export const metadata: Metadata = {
  title: "Masuk — Rental Sewa Barang Tracker",
};

export default function LoginPage() {
  return (
    <AuthCard
      title={loginCopy.title}
      subtitle={loginCopy.subtitle}
      footer={
        <>
          {loginCopy.footerText}{" "}
          <Link href="/register" className="font-medium text-primary hover:underline">
            {loginCopy.footerLinkText}
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthCard>
  );
}
