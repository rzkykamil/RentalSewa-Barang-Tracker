"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { UserStatusBadge } from "@/components/admin/UserStatusBadge";
import { adminUsersCopy } from "@/lib/copy/admin";
import type { AdminUserDto } from "@/modules/admin/admin.service";
import { ROLE_LABEL } from "@/lib/mock/session";

interface AdminUsersTableProps {
  initialUsers: AdminUserDto[];
  /** Acting admin's own id — their row hides the deactivate action (BE rejects self-deactivation). */
  currentUserId: string;
}

interface AdminApiErrorResponse {
  error: { code: string; message: string; details?: unknown };
}

const FALLBACK_ERROR = "Gagal menonaktifkan user. Coba lagi.";

/**
 * Admin "Kelola User" list. Deactivate calls the real
 * `PATCH /api/v1/admin/users/:id/deactivate` endpoint and re-fetches the
 * list via `router.refresh()` (same pattern as `OwnerBookingsList`) — no
 * local user-state mutation. There is no reactivate endpoint in
 * `docs/api-spec.md` (only `deactivate`), so a deactivated user's row shows
 * a static label instead of an "Aktifkan" action.
 */
export function AdminUsersTable({ initialUsers, currentUserId }: AdminUsersTableProps) {
  const router = useRouter();
  const [message, setMessage] = React.useState<string | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [pendingUserId, setPendingUserId] = React.useState<string | null>(null);

  async function handleDeactivate(user: AdminUserDto) {
    setMessage(null);
    setErrorMessage(null);
    setPendingUserId(user.id);

    try {
      const response = await fetch(`/api/v1/admin/users/${user.id}/deactivate`, {
        method: "PATCH",
      });

      if (!response.ok) {
        const body = (await response.json()) as AdminApiErrorResponse;
        setErrorMessage(body.error.message || FALLBACK_ERROR);
        return;
      }

      setMessage(adminUsersCopy.success.deactivate);
      router.refresh();
    } catch {
      setErrorMessage(FALLBACK_ERROR);
    } finally {
      setPendingUserId(null);
    }
  }

  if (initialUsers.length === 0) {
    return (
      <EmptyState title={adminUsersCopy.empty.title} description={adminUsersCopy.empty.description} />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {message && (
        <p role="status" className="text-sm font-medium text-status-positive">
          {message}
        </p>
      )}
      {errorMessage && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {errorMessage}
        </p>
      )}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{adminUsersCopy.table.name}</TableHead>
                <TableHead className="hidden sm:table-cell">{adminUsersCopy.table.email}</TableHead>
                <TableHead>{adminUsersCopy.table.role}</TableHead>
                <TableHead>{adminUsersCopy.table.status}</TableHead>
                <TableHead className="text-right">{adminUsersCopy.table.actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="max-w-48 truncate font-medium text-foreground">
                    {user.name}
                    <span className="block text-xs font-normal text-muted-foreground sm:hidden">
                      {user.email}
                    </span>
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground sm:table-cell">
                    {user.email}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{ROLE_LABEL[user.role]}</Badge>
                  </TableCell>
                  <TableCell>
                    <UserStatusBadge isActive={user.isActive} />
                  </TableCell>
                  <TableCell className="text-right">
                    {!user.isActive ? (
                      <span className="text-xs text-muted-foreground">
                        {adminUsersCopy.alreadyInactive}
                      </span>
                    ) : user.id === currentUserId ? (
                      <span className="text-xs text-muted-foreground">
                        {adminUsersCopy.selfAccount}
                      </span>
                    ) : (
                      <ConfirmDialog
                        trigger={
                          <Button variant="outline" size="sm" disabled={pendingUserId === user.id}>
                            {adminUsersCopy.actions.deactivate}
                          </Button>
                        }
                        title={adminUsersCopy.dialogs.deactivate.title}
                        description={adminUsersCopy.dialogs.deactivate.description}
                        confirmLabel={adminUsersCopy.dialogs.deactivate.confirm}
                        onConfirm={() => handleDeactivate(user)}
                      />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
