"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSession, signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/auth/FormField";
import { loginCopy } from "@/lib/copy/auth";

interface FieldErrors {
  email?: string;
  password?: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Fallback landing page per role when there is no `callbackUrl` to return to. */
const ROLE_DASHBOARD_PATH: Record<string, string> = {
  OWNER: "/owner/dashboard",
  RENTER: "/renter/dashboard",
  ADMIN: "/admin/dashboard",
};

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setServerError(null);

    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setStatus("loading");

    const result = await signIn("credentials", {
      email: email.trim(),
      password,
      redirect: false,
    });

    if (!result || result.error) {
      setStatus("idle");
      setServerError(loginCopy.errors.invalidCredentials);
      return;
    }

    setStatus("success");
    const session = await getSession();
    const role = session?.user?.role;
    const destination = callbackUrl || (role ? ROLE_DASHBOARD_PATH[role] : undefined) || "/";
    router.push(destination);
    router.refresh();
  }

  const isLoading = status === "loading" || status === "success";

  return (
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
  );
}
