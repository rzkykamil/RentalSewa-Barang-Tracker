"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, User as UserIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { FormField } from "@/components/auth/FormField";
import type { UserProfile } from "@/modules/auth/auth.service";

interface ProfileFormErrors {
  name?: string;
}

interface ProfileFormProps {
  user: UserProfile;
}

interface ProfileApiErrorResponse {
  error: { code: string; message: string; details?: unknown };
}

/**
 * Edit-profile form shared by the Owner/Renter/Admin dashboard shells.
 * Submits to `PATCH /api/v1/auth/me`. The avatar field is a local preview
 * only for now — real upload isn't wired up yet (out of scope for the Auth
 * module; see docs/todo/frontend.md).
 */
export function ProfileForm({ user }: ProfileFormProps) {
  const router = useRouter();
  const [name, setName] = React.useState(user.name);
  const [phone, setPhone] = React.useState(user.phone ?? "");
  const [avatarPreview, setAvatarPreview] = React.useState<string | null>(
    user.avatarUrl
  );
  const [errors, setErrors] = React.useState<ProfileFormErrors>({});
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [status, setStatus] = React.useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );

  React.useEffect(() => {
    return () => {
      if (avatarPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("idle");
    setServerError(null);

    if (!name.trim()) {
      setErrors({ name: "Nama lengkap wajib diisi." });
      return;
    }
    setErrors({});
    setStatus("loading");

    try {
      const response = await fetch("/api/v1/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim() ? phone.trim() : null,
        }),
      });

      if (!response.ok) {
        const body = (await response.json()) as ProfileApiErrorResponse;
        setStatus("error");
        setServerError(body.error.message);
        return;
      }

      setStatus("success");
      router.refresh();
    } catch {
      setStatus("error");
      setServerError("Gagal terhubung ke server. Coba lagi.");
    }
  }

  const isLoading = status === "loading";

  return (
    <Card className="max-w-lg">
      <CardContent>
        <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
          <div className="flex flex-col items-center gap-3 sm:flex-row">
            <span className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary text-secondary-foreground">
              {avatarPreview ? (
                // eslint-disable-next-line @next/next/no-img-element -- local blob preview only, not a remote asset
                <img
                  src={avatarPreview}
                  alt="Pratinjau foto profil"
                  className="size-full object-cover"
                />
              ) : (
                <UserIcon className="size-7" aria-hidden="true" />
              )}
            </span>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="profile-avatar">Foto Profil</Label>
              <Input
                id="profile-avatar"
                name="avatar"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                disabled={isLoading}
                className="h-auto py-1"
              />
              <p className="text-xs text-muted-foreground">
                Pratinjau lokal saja — unggah sungguhan belum aktif.
              </p>
            </div>
          </div>

          <FormField id="profile-name" label="Nama Lengkap" error={errors.name}>
            <Input
              id="profile-name"
              name="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              aria-invalid={Boolean(errors.name)}
              disabled={isLoading}
            />
          </FormField>

          <FormField id="profile-email" label="Email">
            <Input id="profile-email" value={user.email} disabled readOnly />
          </FormField>

          <FormField
            id="profile-phone"
            label="Nomor Telepon (opsional)"
            hint="Digunakan untuk komunikasi transaksi."
          >
            <Input
              id="profile-phone"
              name="phone"
              type="tel"
              placeholder="08xxxxxxxxxx"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              disabled={isLoading}
            />
          </FormField>

          {status === "success" && (
            <p role="status" className="text-sm font-medium text-status-positive">
              Profil berhasil diperbarui.
            </p>
          )}
          {status === "error" && (
            <p role="alert" className="text-sm font-medium text-destructive">
              {serverError ?? "Gagal memperbarui profil. Coba lagi."}
            </p>
          )}

          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="animate-spin" aria-hidden="true" />}
              {isLoading ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
