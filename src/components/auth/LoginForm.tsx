"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/auth/FormField";
import { loginCopy } from "@/lib/copy/auth";
import { MOCK_USERS } from "@/lib/mock/session";

interface FieldErrors {
  email?: string;
  password?: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Route each mock role should land on after a successful mock login. */
const ROLE_DASHBOARD_PATH: Record<string, string> = {
  OWNER: "/owner/dashboard",
  RENTER: "/renter/dashboard",
  ADMIN: "/admin/dashboard",
};

/**
 * Login form — Periode 1 (frontend + mock data only). There is no real
 * NextAuth call here: submitting simulates a network request and either
 * "logs in" (redirect to the matching mock dashboard) or shows a mock
 * invalid-credentials error, so all UI states are demonstrable without a
 * backend.
 */
export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [fieldErrors, setFieldErrors] = React.useState<FieldErrors>({});
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [status, setStatus] = React.useState<"idle" | "loading" | "success">(
    "idle"
  );

  function validate(): FieldErrors {
    const errors: FieldErrors = {};
    if (!email.trim()) {
      errors.email = loginCopy.errors.emailRequired;
    } else if (!EMAIL_PATTERN.test(email)) {
      errors.email = loginCopy.errors.emailInvalid;
    }
    if (!password) {
      errors.password = loginCopy.errors.passwordRequired;
    }
    return errors;
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setServerError(null);

    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setStatus("loading");

    // Simulated network round-trip (mock only — no real auth call yet).
    setTimeout(() => {
      const matchedUser = Object.values(MOCK_USERS).find(
        (user) => user.email.toLowerCase() === email.trim().toLowerCase()
      );

      if (!matchedUser) {
        setStatus("idle");
        setServerError(loginCopy.errors.invalidCredentials);
        return;
      }

      setStatus("success");
      const destination = ROLE_DASHBOARD_PATH[matchedUser.role] ?? "/";
      setTimeout(() => router.push(destination), 600);
    }, 900);
  }

  const isLoading = status === "loading" || status === "success";

  return (
    <>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
        <FormField id="login-email" label={loginCopy.fields.email.label} error={fieldErrors.email}>
          <Input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder={loginCopy.fields.email.placeholder}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-invalid={Boolean(fieldErrors.email)}
            disabled={isLoading}
          />
        </FormField>

        <FormField
          id="login-password"
          label={loginCopy.fields.password.label}
          error={fieldErrors.password}
        >
          <Input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder={loginCopy.fields.password.placeholder}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            aria-invalid={Boolean(fieldErrors.password)}
            disabled={isLoading}
          />
        </FormField>

        {serverError && (
          <p role="alert" className="text-sm font-medium text-destructive">
            {serverError}
          </p>
        )}

        <Button type="submit" size="lg" className="mt-1 w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="animate-spin" aria-hidden="true" />}
          {status === "loading"
            ? loginCopy.submitLoading
            : status === "success"
              ? "Berhasil masuk..."
              : loginCopy.submit}
        </Button>
      </form>

      <div className="mt-2 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
        <p className="font-medium text-foreground">Akun demo (mock, fase frontend):</p>
        <ul className="mt-1 list-inside list-disc">
          {Object.values(MOCK_USERS).map((user) => (
            <li key={user.id}>
              {user.email} — kata sandi bebas
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
