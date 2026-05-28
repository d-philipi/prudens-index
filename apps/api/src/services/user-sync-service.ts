import type { UserRole } from '@prudens/shared/types';
import { clerkClient } from '../lib/clerk-client.js';
import { parsePublicMetadata } from '../lib/clerk-metadata.js';
import { companyRepository } from '../repositories/company-repository.js';
import { userRepository } from '../repositories/user-repository.js';

export const userSyncService = {
  async upsertFromMetadata(input: {
    clerkUserId: string;
    email: string;
    role: UserRole;
    companyId: string | null;
  }) {
    if (input.role === 'client') {
      if (!input.companyId) {
        throw Object.assign(new Error('Empresa é obrigatória para perfil Cliente'), { statusCode: 400 });
      }
      const company = await companyRepository.findById(input.companyId);
      if (!company) {
        throw Object.assign(new Error('Empresa não encontrada'), { statusCode: 400 });
      }
    }

    return userRepository.upsertByClerkId({
      clerkUserId: input.clerkUserId,
      email: input.email,
      role: input.role,
      companyId: input.role === 'admin' ? null : input.companyId,
    });
  },

  async syncFromClerk(clerkUserId: string) {
    const clerkUser = await clerkClient.users.getUser(clerkUserId);
    const email =
      clerkUser.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId)?.emailAddress ??
      clerkUser.emailAddresses[0]?.emailAddress ??
      '';

    const parsed = parsePublicMetadata(clerkUser.publicMetadata);
    if (!parsed) return null;

    try {
      return await this.upsertFromMetadata({
        clerkUserId,
        email,
        role: parsed.role,
        companyId: parsed.companyId,
      });
    } catch {
      return null;
    }
  },
};
