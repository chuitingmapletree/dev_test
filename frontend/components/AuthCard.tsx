"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface AuthCardProps {
  mode: "login" | "register";
}

export default function AuthCard({ mode }: AuthCardProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (localStorage.getItem("isLoggedIn") === "true") {
      router.replace("/create");
    } else {
      setIsChecking(false);
    }
  }, [router]);

  if (isChecking) return null;

  const isLogin = mode === "login";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Please enter your email and password.");
      return;
    }
    localStorage.setItem("isLoggedIn", "true");
    router.push("/create");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold" style={{ color: "#032147" }}>
            Prelegal
          </h1>
          <p className="text-sm mt-1" style={{ color: "#888888" }}>
            Legal agreements made simple
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-lg font-semibold mb-6" style={{ color: "#032147" }}>
            {isLogin ? "Sign in" : "Create account"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "#032147" }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "#032147" }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="••••••••"
                autoComplete={isLogin ? "current-password" : "new-password"}
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              className="w-full py-2 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90 cursor-pointer"
              style={{ backgroundColor: "#753991" }}
            >
              {isLogin ? "Sign in" : "Create account"}
            </button>
          </form>

          <p className="text-center text-sm mt-5" style={{ color: "#888888" }}>
            {isLogin ? (
              <>
                Don&apos;t have an account?{" "}
                <Link href="/register" className="font-medium hover:underline" style={{ color: "#209dd7" }}>
                  Register
                </Link>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <Link href="/" className="font-medium hover:underline" style={{ color: "#209dd7" }}>
                  Sign in
                </Link>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
