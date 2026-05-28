import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { AuthSignOutButton } from '@/components/AuthSignOutButton';
import { homePathForRole, parseRoleFromSessionClaims } from '@/lib/clerkRoles';

export default async function AcessoPendentePage() {
  const { userId, sessionClaims } = await auth();
  if (!userId) redirect('/sign-in');

  const role = parseRoleFromSessionClaims(sessionClaims as Record<string, unknown> | null);
  if (role) redirect(homePathForRole(role));

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center p-6">
      <article className="flex flex-col gap-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <header className="space-y-1 border-b border-slate-100 pb-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Prudens Index</p>
          <h1 className="text-xl font-semibold text-slate-900">Acesso pendente</h1>
        </header>

        <p className="text-sm leading-relaxed text-slate-600">
          Sua conta está autenticada, mas ainda não há um perfil de acesso válido. O Prudens Index funciona
          somente por <strong className="font-medium text-slate-800">convite</strong>: um administrador deve
          enviar um convite com o perfil correto (Administrador ou Cliente vinculado a uma empresa).
        </p>

        <section className="space-y-2 rounded-md border border-slate-100 bg-slate-50 p-4 text-sm text-slate-700">
          <p className="font-medium text-slate-800">O que fazer agora</p>
          <ul className="list-inside list-disc space-y-1">
            <li>Se você recebeu um e-mail de convite, abra o link e conclua a ativação em <code className="text-xs">/sign-up</code>.</li>
            <li>Se o convite já foi aceito, peça ao administrador para revisar seu perfil na aba Usuários.</li>
            <li>Não é possível criar conta ou entrar com redes sociais neste sistema.</li>
          </ul>
        </section>

        <p className="text-sm text-slate-600">
          Depois que o perfil for configurado, saia e entre novamente para atualizar sua sessão.
        </p>

        <footer className="border-t border-slate-100 pt-4">
          <AuthSignOutButton />
        </footer>
      </article>
    </main>
  );
}
