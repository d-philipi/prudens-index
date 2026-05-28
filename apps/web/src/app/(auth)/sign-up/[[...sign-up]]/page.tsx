import { SignUp } from '@clerk/nextjs';

const authAppearance = {
  elements: {
    socialButtonsBlockButton: 'hidden',
    socialButtonsBlockButtonText: 'hidden',
    dividerRow: 'hidden',
  },
};

export default function SignUpPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <SignUp
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        appearance={authAppearance}
      />
    </main>
  );
}
