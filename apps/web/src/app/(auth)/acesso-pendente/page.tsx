import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { AuthSignOutButton } from '@/components/AuthSignOutButton';
import { Logo } from '@/components/layout/Logo';
import { homePathForRole, parseRoleFromSessionClaims } from '@/lib/clerkRoles';
import { strings } from '@/lib/strings';

export default async function AcessoPendentePage() {
  const { userId, sessionClaims } = await auth();
  if (!userId) redirect('/login');

  const role = parseRoleFromSessionClaims(sessionClaims as Record<string, unknown> | null);
  if (role) redirect(homePathForRole(role));

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center bg-surface-page p-6">
      <div className="mb-6 flex justify-center">
        <Logo variant="onLight" />
      </div>
      <article className="flex flex-col gap-6 rounded-lg border border-border-default bg-surface-card p-6">
        <header className="space-y-1 border-b border-border-default pb-4">
          <h1 className="font-display text-xl font-medium text-brand">Acesso pendente</h1>
        </header>

        <p className="text-sm leading-relaxed text-text-subtitle">
          Sua conta está autenticada, mas ainda não há um perfil de acesso válido. O Prudens Index funciona
          somente por <strong className="font-medium text-brand">convite</strong>: um administrador deve
          enviar um convite com o perfil correto (Administrador ou Cliente vinculado a uma empresa).
        </p>

        <section className="space-y-2 rounded-md border border-border-default bg-surface-page p-4 text-sm text-brand">
          <p className="font-medium">O que fazer agora</p>
          <ul className="list-inside list-disc space-y-1">
            <li>{strings.auth.pendingInviteHint}</li>
            <li>Se o convite já foi aceito, peça ao administrador para revisar seu perfil na aba Usuários.</li>
            <li>Não é possível criar conta ou entrar com redes sociais neste sistema.</li>
          </ul>
        </section>

        <p className="text-sm text-text-subtitle">
          Depois que o perfil for configurado, saia e entre novamente para atualizar sua sessão.
        </p>

        <footer className="border-t border-border-default pt-4">
          <AuthSignOutButton />
        </footer>
      </article>
    </main>
  );
}
