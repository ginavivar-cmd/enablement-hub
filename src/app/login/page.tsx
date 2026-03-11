"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        setError("Name not recognized. Try your full name.");
        setLoading(false);
        return;
      }

      router.push("/intake");
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f0f0f0]">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo */}
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gladly-green text-white text-2xl font-bold">
            E
          </div>
          <h1 className="text-2xl font-bold text-[#1a1a1a]">Enablement Planning</h1>
          <p className="mt-2 text-sm text-[#737373]">
            Sign in with your full name
          </p>
        </div>

        {/* Form */}
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="text"
              placeholder="First and Last Name"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 border-[#e5e5e5] bg-white text-[#1a1a1a] placeholder:text-[#aaa] focus-visible:ring-gladly-green"
              autoFocus
            />
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
            <Button
              type="submit"
              className="h-12 w-full bg-gladly-green text-white font-medium hover:bg-gladly-green/90"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
