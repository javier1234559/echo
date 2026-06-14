"use client";

import SignInForm from "@/feature/auth/component/sign-in-form";

export function LoginView() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Sign in
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Use your email and password to sign in.
          </p>
        </div>
        <SignInForm />
      </div>
    </div>
  );
}
