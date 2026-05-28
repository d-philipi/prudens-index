'use client';

import { strings } from '@/lib/strings';
import type { AdminUserListItemDto } from '@prudens/shared/types';

interface UsersTableProps {
  users: AdminUserListItemDto[];
  editingId: string | null;
  onEdit: (user: AdminUserListItemDto) => void;
}

function roleLabel(role: AdminUserListItemDto['role']): string {
  if (role === 'admin') return strings.admin.roleAdmin;
  if (role === 'client') return strings.admin.roleClient;
  return strings.common.notAvailable;
}

function statusLabel(status: AdminUserListItemDto['status']): string {
  return status === 'pending' ? strings.admin.statusPending : strings.admin.statusActive;
}

export function UsersTable({ users, editingId, onEdit }: UsersTableProps) {
  if (users.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border-default bg-surface-page px-4 py-8 text-center text-sm text-text-subtitle">
        {strings.admin.noUsers}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border-default">
      <table className="min-w-full divide-y divide-border-default text-sm">
        <thead className="bg-surface-page">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-brand">{strings.admin.userEmail}</th>
            <th className="px-4 py-3 text-left font-medium text-brand">{strings.admin.userRole}</th>
            <th className="px-4 py-3 text-left font-medium text-brand">{strings.admin.userCompany}</th>
            <th className="px-4 py-3 text-left font-medium text-brand">{strings.admin.userStatus}</th>
            <th className="px-4 py-3 text-right font-medium text-brand" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border-default bg-white">
          {users.map((user) => (
            <tr key={user.id} className={editingId === user.id ? 'bg-surface-page' : undefined}>
              <td className="px-4 py-3 text-brand">{user.email}</td>
              <td className="px-4 py-3 text-brand">{roleLabel(user.role)}</td>
              <td className="px-4 py-3 text-brand">{user.companyName ?? strings.common.notAvailable}</td>
              <td className="px-4 py-3 text-brand">{statusLabel(user.status)}</td>
              <td className="px-4 py-3 text-right">
                <button
                  type="button"
                  onClick={() => onEdit(user)}
                  className="text-sm font-medium text-brand underline"
                >
                  {strings.admin.editUser}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
