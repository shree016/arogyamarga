import { AuthShell } from "@/components/auth/auth-shell";
import { LoginPanel } from "@/components/auth/login-panel";

export default function LoginPage() {
  return (
    <AuthShell title="Sign in">
      <LoginPanel />
    </AuthShell>
  );
}
