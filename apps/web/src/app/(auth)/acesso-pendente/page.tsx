import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { AuthSignOutButton } from '@/components/AuthSignOutButton';
import { homePathForRole, parseRoleFromSessionClaims } from '@/lib/clerkRoles';

export default async function AcessoPendentePage() {
  const { userId, sessionClaims } = await auth();
  if (!userId) redirect('/sign-in');

  const role = parseRoleFromSessionClaims(sessionClaims as Record<string, unknown> | null);
  if (role) redirect(homePathForRole(role));

  const userIdDisplay = userId;

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center p-6">
      <article className="flex flex-col gap-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <header className="space-y-1 border-b border-slate-100 pb-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Prudens Index</p>
          <h1 className="text-xl font-semibold text-slate-900">Configuração de acesso pendente</h1>
        </header>

        <p className="text-sm leading-relaxed text-slate-600">
          Sua conta está autenticada, mas falta o perfil de acesso no{' '}
          <strong className="font-medium text-slate-800">public metadata</strong> do Clerk (claim{' '}
          <code className="rounded bg-white px-1 text-xs ring-1 ring-slate-200">metadata</code> no
          session token). Sem isso,
          o sistema não sabe se você é admin ou cliente.
        </p>

        <section className="space-y-3 rounded-md border border-slate-100 bg-slate-50 p-4 text-sm">
          <p className="font-medium text-slate-800">
            Clerk Dashboard → Users → seu usuário → Public metadata
          </p>
          <pre className="overflow-x-auto rounded bg-white p-3 text-xs text-slate-800 ring-1 ring-slate-200">
{`Admin:
{ "role": "admin" }

Cliente:
{
  "role": "client",
  "companyId": "<uuid da empresa no Postgres>"
}`}
          </pre>
          <p className="text-slate-600">
            <span className="font-medium text-slate-700">User ID</span> (banco / seed):{' '}
            <code className="break-all rounded bg-white px-1.5 py-0.5 font-mono text-xs ring-1 ring-slate-200">
              {userIdDisplay}
            </code>
          </p>
        </section>

        <p className="text-sm text-slate-600">
          Depois de salvar o metadata, recarregue esta página ou saia e entre de novo.
        </p>

        <footer className="flex flex-col gap-3 border-t border-slate-100 pt-4">
          <p className="text-xs text-slate-500">
            Quer testar com outra conta Google ou e-mail? Saia antes de configurar o metadata.
          </p>
          <AuthSignOutButton />
        </footer>
      </article>
    </main>
  );
}
