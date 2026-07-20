"use client";

import * as React from "react";
import { Loader2, User as UserIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { FormField } from "@/components/auth/FormField";
import type { MockUser } from "@/lib/mock/session";

interface ProfileFormErrors {
  name?: string;
}

interface ProfileFormProps {
  user: MockUser;
}

/**
 * Edit-profile form shared by the Owner/Renter/Admin dashboard shells.
 * Periode 1 (frontend + mock data only): submitting simulates a network
 * request and just updates local state — no real API call to
 * /api/v1/users/me yet, and the avatar is a local preview only (no
 * upload).
 */
export function ProfileForm({ user }: ProfileFormProps) {
  const [name, setName] = React.useState(user.name);
  const [phone, setPhone] = React.useState(user.phone ?? "");
  const [avatarPreview, setAvatarPreview] = React.useState<string | null>(
    user.avatarUrl
  );
  const [errors, setErrors] = React.useState<ProfileFormErrors>({});
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

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("idle");

    if (!name.trim()) {
      setErrors({ name: "Nama lengkap wajib diisi." });
      return;
    }
    setErrors({});
    setStatus("loading");

    // Simulated network round-trip (mock only — no real API call yet).
    setTimeout(() => {
      setStatus("success");
    }, 800);
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
              Gagal memperbarui profil. Coba lagi.
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
