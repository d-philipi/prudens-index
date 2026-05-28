import type { AdminUserListItemDto, InviteUserResponse } from '@prudens/shared/types';
import { clerkClient } from '../lib/clerk-client.js';
import { buildPublicMetadata, parsePublicMetadata } from '../lib/clerk-metadata.js';
import { getClerkInviteRedirectUrl } from '../lib/env.js';
import { companyRepository } from '../repositories/company-repository.js';
import type { InviteUserBody, UpdateUserBody } from '../schemas/admin-user-schemas.js';

const LIST_LIMIT = 100;

function clerkErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'errors' in err) {
    const errors = (err as { errors?: Array<{ message?: string; longMessage?: string }> }).errors;
    const first = errors?.[0];
    if (first?.longMessage) return first.longMessage;
    if (first?.message) return first.message;
  }
  if (err instanceof Error) return err.message;
  return 'Erro ao comunicar com o provedor de identidade';
}

function isDuplicateError(err: unknown): boolean {
  const msg = clerkErrorMessage(err).toLowerCase();
  return msg.includes('already') || msg.includes('exists') || msg.includes('duplicate');
}

async function resolveCompanyName(companyId: string | null): Promise<string | null> {
  if (!companyId) return null;
  const company = await companyRepository.findById(companyId);
  return company?.name ?? null;
}

function mapUserToListItem(
  user: {
    id: string;
    emailAddresses: Array<{ emailAddress: string }>;
    publicMetadata: unknown;
  },
  companyName: string | null,
): AdminUserListItemDto {
  const email = user.emailAddresses[0]?.emailAddress ?? '';
  const parsed = parsePublicMetadata(user.publicMetadata);
  return {
    id: user.id,
    kind: 'user',
    email,
    role: parsed?.role ?? null,
    companyId: parsed?.companyId ?? null,
    companyName,
    status: 'active',
  };
}

function mapInvitationToListItem(
  invitation: {
    id: string;
    emailAddress: string;
    publicMetadata: unknown;
    status?: string;
  },
  companyName: string | null,
): AdminUserListItemDto {
  const parsed = parsePublicMetadata(invitation.publicMetadata);
  return {
    id: invitation.id,
    kind: 'invitation',
    email: invitation.emailAddress,
    role: parsed?.role ?? null,
    companyId: parsed?.companyId ?? null,
    companyName,
    status: 'pending',
  };
}

export const clerkUserService = {
  async listUsers(): Promise<AdminUserListItemDto[]> {
    const [userList, invitationList] = await Promise.all([
      clerkClient.users.getUserList({ limit: LIST_LIMIT }),
      clerkClient.invitations.getInvitationList({ status: 'pending', limit: LIST_LIMIT }),
    ]);

    const companyIds = new Set<string>();
    for (const u of userList.data) {
      const parsed = parsePublicMetadata(u.publicMetadata);
      if (parsed?.companyId) companyIds.add(parsed.companyId);
    }
    for (const inv of invitationList.data) {
      const parsed = parsePublicMetadata(inv.publicMetadata);
      if (parsed?.companyId) companyIds.add(parsed.companyId);
    }

    const companyNames = new Map<string, string>();
    await Promise.all(
      [...companyIds].map(async (id) => {
        const name = await resolveCompanyName(id);
        if (name) companyNames.set(id, name);
      }),
    );

    const items: AdminUserListItemDto[] = [];

    for (const inv of invitationList.data) {
      const parsed = parsePublicMetadata(inv.publicMetadata);
      const companyName = parsed?.companyId ? (companyNames.get(parsed.companyId) ?? null) : null;
      items.push(mapInvitationToListItem(inv, companyName));
    }

    for (const u of userList.data) {
      const parsed = parsePublicMetadata(u.publicMetadata);
      const companyName = parsed?.companyId ? (companyNames.get(parsed.companyId) ?? null) : null;
      items.push(mapUserToListItem(u, companyName));
    }

    items.sort((a, b) => {
      if (a.status !== b.status) {
        return a.status === 'pending' ? -1 : 1;
      }
      return a.email.localeCompare(b.email, 'pt-BR');
    });

    return items;
  },

  async inviteUser(body: InviteUserBody): Promise<InviteUserResponse> {
    if (body.role === 'client' && body.companyId) {
      const company = await companyRepository.findById(body.companyId);
      if (!company) {
        throw Object.assign(new Error('Empresa não encontrada'), { statusCode: 400 });
      }
    }

    const publicMetadata = buildPublicMetadata({
      role: body.role,
      companyId: body.role === 'client' ? body.companyId : null,
    });

    try {
      const invitation = await clerkClient.invitations.createInvitation({
        emailAddress: body.email,
        redirectUrl: getClerkInviteRedirectUrl(),
        publicMetadata,
      });
      return {
        invitationId: invitation.id,
        email: invitation.emailAddress,
        status: invitation.status ?? 'pending',
      };
    } catch (err) {
      if (isDuplicateError(err)) {
        throw Object.assign(new Error('E-mail já possui conta ou convite pendente'), { statusCode: 409 });
      }
      throw Object.assign(new Error(clerkErrorMessage(err)), { statusCode: 400 });
    }
  },

  async updateUserOrInvitation(
    id: string,
    body: UpdateUserBody,
  ): Promise<AdminUserListItemDto> {
    const publicMetadata = buildPublicMetadata({
      role: body.role,
      companyId: body.role === 'client' ? body.companyId ?? null : null,
    });

    if (body.role === 'client' && body.companyId) {
      const company = await companyRepository.findById(body.companyId);
      if (!company) {
        throw Object.assign(new Error('Empresa não encontrada'), { statusCode: 400 });
      }
    }

    if (id.startsWith('user_')) {
      try {
        const updated = await clerkClient.users.updateUser(id, { publicMetadata });
        const parsed = parsePublicMetadata(updated.publicMetadata);
        const companyName = parsed?.companyId ? await resolveCompanyName(parsed.companyId) : null;
        return mapUserToListItem(updated, companyName);
      } catch (err) {
        throw Object.assign(new Error(clerkErrorMessage(err)), { statusCode: 400 });
      }
    }

    // Convite pendente: SDK v1 não expõe updateInvitation — revogar e reenviar
    let email: string;
    try {
      const invitations = await clerkClient.invitations.getInvitationList({ status: 'pending', limit: LIST_LIMIT });
      const inv = invitations.data.find((i) => i.id === id);
      if (!inv) {
        throw Object.assign(new Error('Convite não encontrado'), { statusCode: 404 });
      }
      email = inv.emailAddress;
      await clerkClient.invitations.revokeInvitation(id);
    } catch (err) {
      if (err && typeof err === 'object' && 'statusCode' in err) throw err;
      throw Object.assign(new Error(clerkErrorMessage(err)), { statusCode: 400 });
    }

    try {
      const recreated = await clerkClient.invitations.createInvitation({
        emailAddress: email,
        redirectUrl: getClerkInviteRedirectUrl(),
        publicMetadata,
      });
      const parsed = parsePublicMetadata(recreated.publicMetadata);
      const companyName = parsed?.companyId ? await resolveCompanyName(parsed.companyId) : null;
      return mapInvitationToListItem(recreated, companyName);
    } catch (err) {
      throw Object.assign(
        new Error(
          'Não foi possível atualizar o convite. Revogue manualmente no Clerk e envie um novo convite.',
        ),
        { statusCode: 409 },
      );
    }
  },
};
