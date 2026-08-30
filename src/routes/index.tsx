import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparks as Sparkles } from "iconoir-react";
import { isCloudWorkspaceModeEnabled } from "@/lib/local-preview";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    if (isCloudWorkspaceModeEnabled()) throw redirect({ to: "/today" });
  },
  head: () => ({
    meta: [
      { title: "Путь — от сфер жизни к ежедневным действиям" },
      {
        name: "description",
        content:
          "Выбери сферу жизни, сформулируй результат и превращай его в ритуалы, задачи и временные слоты.",
      },
      { property: "og:title", content: "Путь — от сфер жизни к ежедневным действиям" },
      {
        property: "og:description",
        content: "Планирование, в котором каждое действие связано с твоим результатом.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { userId, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && userId) navigate({ to: "/today", replace: true });
  }, [loading, userId, navigate]);

  return (
    <div className="app-screen mx-auto flex min-h-dvh w-full max-w-md flex-col justify-between px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(3rem,env(safe-area-inset-top))] min-[380px]:px-6 min-[380px]:pt-16">
      <div className="animate-rise">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-mid">
          <Sparkles className="size-5" strokeWidth={2} aria-hidden />
        </div>
        <p className="mt-7 text-sm font-semibold text-primary">Планирование через смысл</p>
        <h1 className="mt-3 text-[clamp(2.25rem,11vw,3rem)] font-bold leading-[1.03] tracking-[-0.045em]">
          Каждое действие
          <br />
          ведёт к результату
        </h1>
        <p className="mt-5 max-w-sm text-[17px] leading-relaxed text-muted-foreground">
          Начни со сферы жизни, сформулируй желаемый результат и разложи его на понятные действия:
          ритуалы, регулярные действия, задачи, временные слоты и подготовку.
        </p>
      </div>

      <div className="glass-surface mt-8 space-y-3 rounded-[30px] p-3.5">
        <Button asChild size="lg">
          <Link to="/auth">
            Начать <ArrowRight aria-hidden />
          </Link>
        </Button>
      </div>
    </div>
  );
}
