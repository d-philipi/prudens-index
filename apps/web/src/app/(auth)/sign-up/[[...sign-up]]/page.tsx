import { SignUp } from '@clerk/nextjs';
import { authAppearance } from '@/lib/clerk-appearance';
import { AuthLayout } from '@/components/layout/AuthLayout';

export default function SignUpPage() {
  return (
    <AuthLayout>
      <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" appearance={authAppearance} />
    </AuthLayout>
  );
}
