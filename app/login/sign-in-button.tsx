"use client";

import { signIn } from "next-auth/react";

export function GoogleSignInButton({ callbackUrl }: { callbackUrl: string }) {
  return (
    <button
      className="auth-button"
      type="button"
      onClick={() => signIn("google", { callbackUrl })}
    >
      Continue with Google
    </button>
  );
}
