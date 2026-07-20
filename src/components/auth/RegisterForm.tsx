"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormField } from "@/components/auth/FormField";
import { registerCopy } from "@/lib/copy/auth";
import { MOCK_USERS, type MockRole } from "@/lib/mock/session";

interface FieldErrors {
  name?: string;
  email?: string;
  password?: string;
  role?: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REGISTERABLE_ROLES: string[] = registerCopy.roleOptions.map(
  (option) => option.value
);

/**
 * Registration form — Periode 1 (frontend + mock data only). Submitting
 * simulates a network request; there is no real call to
 * /api/v1/auth/register yet. Admin is intentionally not selectable here
 * (accounts are created manually per docs/database-design.md).
 */
export function RegisterForm() {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [role, setRole] = React.useState<MockRole | "">("");
  const [fieldErrors, setFieldErrors] = React.useState<FieldErrors>({});
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [status, setStatus] = React.useState<"idle" | "loading" | "success">(
    "idle"
  );

  function validate(): FieldErrors {
    const errors: FieldErrors = {};
    if (!name.trim()) errors.name = registerCopy.errors.nameRequired;

    if (!email.trim()) {
      errors.email = registerCopy.errors.emailRequired;
    } else if (!EMAIL_PATTERN.test(email)) {
      errors.email = registerCopy.errors.emailInvalid;
    }

    if (!password) {
      errors.password = registerCopy.errors.passwordRequired;
    } else if (password.length < 8) {
      errors.password = registerCopy.errors.passwordTooShort;
    }

    if (!role || !REGISTERABLE_ROLES.includes(role)) {
      errors.role = registerCopy.errors.roleRequired;
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

    // Simulated network round-trip (mock only — no real registration call yet).
    setTimeout(() => {
      const isEmailTaken = Object.values(MOCK_USERS).some(
        (user) => user.email.toLowerCase() === email.trim().toLowerCase()
      );

      if (isEmailTaken) {
        setStatus("idle");
        setServerError(registerCopy.errors.emailTaken);
        return;
      }

      setStatus("success");
      setTimeout(() => router.push("/login"), 1200);
    }, 900);
  }

  const isLoading = status === "loading" || status === "success";

  if (status === "success") {
    return (
      <div className="flex flex-col items-center gap-2 py-4 text-center">
        <p className="text-sm font-medium text-status-positive">
          {registerCopy.success}
        </p>
      </div>
    );
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
      <FormField id="register-name" label={registerCopy.fields.name.label} error={fieldErrors.name}>
        <Input
          id="register-name"
          name="name"
          type="text"
          autoComplete="name"
          placeholder={registerCopy.fields.name.placeholder}
          value={name}
          onChange={(event) => setName(event.target.value)}
          aria-invalid={Boolean(fieldErrors.name)}
          disabled={isLoading}
        />
      </FormField>

      <FormField id="register-email" label={registerCopy.fields.email.label} error={fieldErrors.email}>
        <Input
          id="register-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder={registerCopy.fields.email.placeholder}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          aria-invalid={Boolean(fieldErrors.email)}
          disabled={isLoading}
        />
      </FormField>

      <FormField
        id="register-password"
        label={registerCopy.fields.password.label}
        error={fieldErrors.password}
        hint={fieldErrors.password ? undefined : "Minimal 8 karakter."}
      >
        <Input
          id="register-password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder={registerCopy.fields.password.placeholder}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          aria-invalid={Boolean(fieldErrors.password)}
          disabled={isLoading}
        />
      </FormField>

      <FormField id="register-phone" label={registerCopy.fields.phone.label}>
        <Input
          id="register-phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          placeholder={registerCopy.fields.phone.placeholder}
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          disabled={isLoading}
        />
      </FormField>

      <FormField id="register-role" label={registerCopy.fields.role.label} error={fieldErrors.role}>
        <Select
          value={role}
          onValueChange={(value) => setRole(value as MockRole)}
          disabled={isLoading}
        >
          <SelectTrigger
            id="register-role"
            className="w-full"
            aria-invalid={Boolean(fieldErrors.role)}
          >
            <SelectValue placeholder={registerCopy.fields.role.placeholder} />
          </SelectTrigger>
          <SelectContent>
            {registerCopy.roleOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>

      {serverError && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {serverError}
        </p>
      )}

      <Button type="submit" size="lg" className="mt-1 w-full" disabled={isLoading}>
        {isLoading && <Loader2 className="animate-spin" aria-hidden="true" />}
        {status === "loading" ? registerCopy.submitLoading : registerCopy.submit}
      </Button>
    </form>
  );
}
