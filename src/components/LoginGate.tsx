import { useState, type FormEvent } from "react";
import { Lock } from "lucide-react";
import { persistPassword, verifyPassword, type AccessMode } from "@/lib/auth";

interface LoginGateProps {
  onUnlock: (mode: AccessMode) => void;
}

export default function LoginGate({ onUnlock }: LoginGateProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [checking, setChecking] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!password.trim() || checking) return;
    setChecking(true);
    const mode = await verifyPassword(password);
    if (mode) {
      await persistPassword(password);
      onUnlock(mode);
    } else {
      setError(true);
      setPassword("");
      setChecking(false);
    }
  };

  return (
    <div className="flex h-[100dvh] items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-lg">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Lock className="h-6 w-6 text-primary" />
        </div>
        <h1 className="text-center text-2xl font-extrabold tracking-tight">Norsko-Švédsko 2026</h1>

        <form onSubmit={handleSubmit} className="mt-6">
          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError(false);
            }}
            placeholder="Heslo"
            autoFocus
            autoComplete="current-password"
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none ring-primary/40 focus:ring-2"
          />
          {error && <p className="mt-2 text-sm text-red-600">Nesprávné heslo.</p>}
          <button
            type="submit"
            disabled={!password.trim() || checking}
            className="mt-4 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
          >
            {checking ? "Ověřuji…" : "Vstoupit"}
          </button>
        </form>
      </div>
    </div>
  );
}
