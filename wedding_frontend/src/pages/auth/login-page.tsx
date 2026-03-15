import { LoginForm } from "@/pages/auth/_components/login-form";

export function LoginPage() {
  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-6 md:px-6">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_left,rgba(212,175,55,0.09),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(212,175,55,0.08),transparent_24%)]" />

      <div className="relative mx-auto flex min-h-[calc(100vh-3rem)] max-w-[1320px] items-center justify-center">
        <LoginForm />
      </div>
    </main>
  );
}
