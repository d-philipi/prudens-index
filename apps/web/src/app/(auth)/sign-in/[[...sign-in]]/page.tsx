import { SignInEntry } from '@/components/auth/SignInEntry';
import { AuthLayout } from '@/components/layout/AuthLayout';

export default function SignInPage() {
  return (
    <AuthLayout>
      <SignInEntry />
    </AuthLayout>
  );
}
