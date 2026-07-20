import type { Metadata } from "next";
import Link from "next/link";

import { AuthCard } from "@/components/auth/AuthCard";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { registerCopy } from "@/lib/copy/auth";

export const metadata: Metadata = {
  title: "Daftar — Rental Sewa Barang Tracker",
};

export default function RegisterPage() {
  return (
    <AuthCard
      title={registerCopy.title}
      subtitle={registerCopy.subtitle}
      footer={
        <>
          {registerCopy.footerText}{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            {registerCopy.footerLinkText}
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthCard>
  );
}
