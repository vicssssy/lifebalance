import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { PageContainer, PageHeading } from "@/components/ui/layout";

interface AppScreenProps {
  title: string;
  subtitle?: ReactNode;
  right?: ReactNode;
  children: ReactNode;
  /** Экраны без нижней навигации (создание действия) убирают нижний отступ. */
  withNav?: boolean;
}

/** Каркас экрана: safe area, крупный заголовок, единый контейнер контента. */
export function AppScreen({ title, subtitle, right, children, withNav = true }: AppScreenProps) {
  return (
    <div className="app-screen min-h-dvh w-full bg-transparent">
      <header className="safe-top pb-6 pt-3">
        <PageContainer>
          <PageHeading className="animate-rise" title={title} subtitle={subtitle} right={right} />
        </PageContainer>
      </header>
      <main className={cn(withNav ? "pb-36" : "pb-16")}>
        <PageContainer>{children}</PageContainer>
      </main>
    </div>
  );
}
