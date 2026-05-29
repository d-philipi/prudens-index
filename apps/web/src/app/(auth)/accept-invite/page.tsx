import { Suspense } from 'react';
import { AuthCard } from '@/features/auth/components/AuthCard';
import { AcceptInviteForm } from '@/features/auth/components/AcceptInviteForm';

export default function AcceptInvitePage() {
  return (
    <AuthCard>
      <Suspense fallback={<p className="text-sm text-text-subtitle">{stringsLoading}</p>}>
        <AcceptInviteForm />
      </Suspense>
    </AuthCard>
  );
}

const stringsLoading = 'Carregando...';
