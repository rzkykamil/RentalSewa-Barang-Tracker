"use client";

import * as React from "react";

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
import type { AdminUser } from "@/lib/mock/admin";
import { ROLE_LABEL } from "@/lib/mock/session";

interface AdminUsersTableProps {
  initialUsers: AdminUser[];
}

/**
 * Admin "Kelola User" list. Periode 16 (frontend + mock data only):
 * deactivate/activate only mutates local React state — no real
 * persistence yet, see docs/todo/frontend.md.
 */
export function AdminUsersTable({ initialUsers }: AdminUsersTableProps) {
  const [users, setUsers] = React.useState(initialUsers);
  const [message, setMessage] = React.useState<string | null>(null);

  function handleToggleActive(user: AdminUser) {
    const nextIsActive = !user.isActive;
    setUsers((prev) =>
      prev.map((candidate) =>
        candidate.id === user.id ? { ...candidate, isActive: nextIsActive } : candidate
      )
    );
    setMessage(
      nextIsActive ? adminUsersCopy.success.activate : adminUsersCopy.success.deactivate
    );
  }

  if (users.length === 0) {
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
              {users.map((user) => (
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
                    {user.isActive ? (
                      <ConfirmDialog
                        trigger={
                          <Button variant="outline" size="sm">
                            {adminUsersCopy.actions.deactivate}
                          </Button>
                        }
                        title={adminUsersCopy.dialogs.deactivate.title}
                        description={adminUsersCopy.dialogs.deactivate.description}
                        confirmLabel={adminUsersCopy.dialogs.deactivate.confirm}
                        onConfirm={() => handleToggleActive(user)}
                      />
                    ) : (
                      <ConfirmDialog
                        trigger={
                          <Button variant="outline" size="sm">
                            {adminUsersCopy.actions.activate}
                          </Button>
                        }
                        title={adminUsersCopy.dialogs.activate.title}
                        description={adminUsersCopy.dialogs.activate.description}
                        confirmLabel={adminUsersCopy.dialogs.activate.confirm}
                        destructive={false}
                        onConfirm={() => handleToggleActive(user)}
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
