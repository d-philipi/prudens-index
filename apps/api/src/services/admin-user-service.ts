import type { AdminUserListItemDto, InviteUserResponse } from '@prudens/shared/types';
import type { AuthContext } from '../types/auth-context.js';
import type { InviteUserBody, UpdateUserBody } from '../schemas/admin-user-schemas.js';
import { clerkClient } from '../lib/clerk-client.js';
import { clerkUserService } from './clerk-user-service.js';
import { userSyncService } from './user-sync-service.js';

export const adminUserService = {
  async list(): Promise<AdminUserListItemDto[]> {
    return clerkUserService.listUsers();
  },

  async invite(body: InviteUserBody): Promise<InviteUserResponse> {
    return clerkUserService.inviteUser(body);
  },

  async update(
    id: string,
    body: UpdateUserBody,
    actor: AuthContext,
  ): Promise<AdminUserListItemDto> {
    if (id.startsWith('user_') && id === actor.clerkUserId && body.role !== 'admin') {
      throw Object.assign(
        new Error('Você não pode remover seu próprio perfil de administrador'),
        { statusCode: 400 },
      );
    }

    const updated = await clerkUserService.updateUserOrInvitation(id, body);

    if (id.startsWith('user_')) {
      const clerkUser = await clerkClient.users.getUser(id);
      const email =
        clerkUser.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId)?.emailAddress ??
        clerkUser.emailAddresses[0]?.emailAddress ??
        '';

      await userSyncService.upsertFromMetadata({
        clerkUserId: id,
        email,
        role: body.role,
        companyId: body.role === 'client' ? body.companyId ?? null : null,
      });
    }

    return updated;
  },
};
