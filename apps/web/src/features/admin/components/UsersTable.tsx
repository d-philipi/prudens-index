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
      <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-600">
        {strings.admin.noUsers}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-slate-700">{strings.admin.userEmail}</th>
            <th className="px-4 py-3 text-left font-medium text-slate-700">{strings.admin.userRole}</th>
            <th className="px-4 py-3 text-left font-medium text-slate-700">{strings.admin.userCompany}</th>
            <th className="px-4 py-3 text-left font-medium text-slate-700">{strings.admin.userStatus}</th>
            <th className="px-4 py-3 text-right font-medium text-slate-700" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {users.map((user) => (
            <tr key={user.id} className={editingId === user.id ? 'bg-slate-50' : undefined}>
              <td className="px-4 py-3 text-slate-900">{user.email}</td>
              <td className="px-4 py-3 text-slate-700">{roleLabel(user.role)}</td>
              <td className="px-4 py-3 text-slate-700">{user.companyName ?? strings.common.notAvailable}</td>
              <td className="px-4 py-3 text-slate-700">{statusLabel(user.status)}</td>
              <td className="px-4 py-3 text-right">
                <button
                  type="button"
                  onClick={() => onEdit(user)}
                  className="text-sm font-medium text-slate-900 underline"
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
