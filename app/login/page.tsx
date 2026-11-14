import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { GoogleSignInButton } from "./sign-in-button";

type LoginPageProps = {
  searchParams: Promise<{ callbackUrl?: string | string[] }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await auth();
  if (session) redirect("/");

  const params = await searchParams;
  const requestedCallback = Array.isArray(params.callbackUrl)
    ? params.callbackUrl[0]
    : params.callbackUrl;
  const callbackUrl =
    requestedCallback?.startsWith("/") && !requestedCallback.startsWith("//")
      ? requestedCallback
      : "/";

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="login-title">
        <h1 id="login-title">Welcome to NCERT One Stop</h1>
        <p>Sign in with Google to continue to your study archive.</p>
        <GoogleSignInButton callbackUrl={callbackUrl} />
      </section>
    </main>
  );
}
