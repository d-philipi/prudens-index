'use client';

import { useAuth } from '@clerk/nextjs';
import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/apiClient';
import { strings } from '@/lib/strings';
import type { AdminCompanyCardDto, AdminUserListItemDto } from '@prudens/shared/types';
import { Breadcrumb } from '@/components/shared/Breadcrumb';
import { InviteUserForm } from './InviteUserForm';
import { UsersTable } from './UsersTable';
import { EditUserPanel } from './EditUserPanel';

export function UsersPage() {
  const { getToken } = useAuth();
  const [users, setUsers] = useState<AdminUserListItemDto[]>([]);
  const [companies, setCompanies] = useState<AdminCompanyCardDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<AdminUserListItemDto | null>(null);
  const [updateBanner, setUpdateBanner] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('Usuário não autenticado');

      const [userList, companyList] = await Promise.all([
        apiFetch<AdminUserListItemDto[]>('/api/admin/users', { token }),
        apiFetch<AdminCompanyCardDto[]>('/api/admin/companies', { token }),
      ]);

      setUsers(userList);
      setCompanies(companyList);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : strings.admin.loadUsersError);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const onInviteSuccess = () => {
    void loadData();
  };

  const onUserSaved = () => {
    setUpdateBanner(strings.admin.updateSuccess);
    void loadData();
  };

  return (
    <div className="space-y-8">
      <Breadcrumb items={[{ label: strings.admin.users }]} />

      <header className="space-y-1">
        <h2 className="text-lg font-semibold text-brand">{strings.admin.usersTitle}</h2>
        <p className="text-sm text-text-subtitle">{strings.admin.usersDescription}</p>
      </header>

      <InviteUserForm companies={companies} onSuccess={onInviteSuccess} />

      <section className="space-y-4">
        {updateBanner && (
          <p className="rounded border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800" role="status">
            {updateBanner}
          </p>
        )}

        {loading && <p className="text-sm text-text-subtitle">{strings.common.loading}</p>}

        {loadError && !loading && (
          <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">
            <p>{loadError}</p>
            <button
              type="button"
              onClick={() => void loadData()}
              className="mt-3 rounded bg-red-800 px-3 py-1.5 text-sm font-medium text-white"
            >
              {strings.admin.retryLoad}
            </button>
          </div>
        )}

        {!loading && !loadError && (
          <>
            <UsersTable
              users={users}
              editingId={editingUser?.id ?? null}
              onEdit={(u) => {
                setEditingUser(u);
                setUpdateBanner(null);
              }}
            />
            {editingUser && (
              <EditUserPanel
                user={editingUser}
                companies={companies}
                onClose={() => setEditingUser(null)}
                onSaved={onUserSaved}
              />
            )}
          </>
        )}
      </section>
    </div>
  );
}
