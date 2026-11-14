import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";

export default async function LogoutPage() {
  const session = await auth();
  if (!session) redirect("/login");

  async function signOutAction() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="logout-title">
        <h1 id="logout-title">Sign out?</h1>
        <p>You are signed in to NCERT One Stop.</p>
        <form action={signOutAction}>
          <button className="auth-button" type="submit">
            Sign out
          </button>
        </form>
      </section>
    </main>
  );
}
