import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/useAuth";
import { PrimaryButton, TextField } from "@/components/fields";
import { Button } from "@/components/ui/button";
import { Fingerprint as Sparkles } from "iconoir-react";
import { isLocalPreviewAuthBypassEnabled } from "@/lib/local-preview";

export const Route = createFileRoute("/auth")({
  beforeLoad: () => {
    if (isLocalPreviewAuthBypassEnabled()) throw redirect({ to: "/today" });
  },
  head: () => ({
    meta: [
      { title: "Вход — Путь" },
      { name: "description", content: "Войди или создай аккаунт, чтобы планировать свой путь." },
      { property: "og:title", content: "Вход — Путь" },
      { property: "og:description", content: "Войди, чтобы вернуться к своим целям и действиям." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { userId, loading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && userId) navigate({ to: "/today", replace: true });
  }, [loading, userId, navigate]);

  async function submit() {
    if (!email.trim() || password.length < 6) {
      toast.error("Введи почту и пароль не короче 6 символов");
      return;
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: `${window.location.origin}/today` },
        });
        if (error) throw error;
        toast.success("Аккаунт создан. Подтвердите почту по ссылке из письма");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось войти");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Не удалось войти через Google");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/today", replace: true });
  }

  return (
    <div className="app-screen animate-rise mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-4 py-[max(2rem,env(safe-area-inset-top))] min-[360px]:px-5">
      <div className="rounded-[34px] border border-white/85 bg-white/74 p-5 shadow-high backdrop-blur-2xl min-[380px]:p-7">
        <div className="flex items-center justify-end">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-secondary text-primary">
            <Sparkles className="size-5" aria-hidden />
          </div>
        </div>

        <h1 className="mt-8 text-[2rem] font-bold leading-tight tracking-[-0.035em]">
          {mode === "signin" ? "С возвращением" : "Создать аккаунт"}
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
          {mode === "signin"
            ? "Войди, чтобы продолжить свой путь."
            : "Пара шагов — и можно планировать."}
        </p>

        <div className="mt-8 space-y-3">
          <TextField value={email} onChange={setEmail} placeholder="Почта" />
          <TextField value={password} onChange={setPassword} placeholder="Пароль" type="password" />
          <PrimaryButton onClick={submit} loading={busy}>
            {mode === "signin" ? "Войти" : "Зарегистрироваться"}
          </PrimaryButton>
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="font-medium"
            onClick={google}
          >
            Продолжить с Google
          </Button>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mt-5 w-full"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
        >
          {mode === "signin" ? "У меня ещё нет аккаунта" : "У меня уже есть аккаунт"}
        </Button>
      </div>
    </div>
  );
}
