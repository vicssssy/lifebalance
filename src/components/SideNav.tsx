import { Link, useNavigate } from "@tanstack/react-router";
import { Plus } from "iconoir-react";
import { NAV_ALL } from "@/components/nav-items";
import { ICON_STROKE } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";

/** Десктопная контекстная навигация слева. На мобильных скрыта. */
export function SideNav() {
  const navigate = useNavigate();

  return (
    <aside className="glass-surface fixed inset-y-0 left-0 z-40 hidden w-60 flex-col rounded-none border-y-0 border-l-0 px-3 py-6 md:flex">
      <div className="px-3">
        <p className="day-part-title">Путь</p>
        <p className="mt-1 text-lg font-semibold leading-snug">Планирование</p>
      </div>

      <Button
        className="mt-6"
        onClick={() => navigate({ to: "/new" })}
        aria-label="Добавить действие"
      >
        <Plus strokeWidth={2} aria-hidden />
        Добавить
      </Button>

      <nav className="mt-6 flex flex-col gap-1">
        {NAV_ALL.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            activeOptions={{ exact: false }}
            className="focus-ring group flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-muted-foreground transition-[background-color,color,transform] duration-200 ease-out hover:bg-secondary hover:text-foreground active:scale-[0.99] data-[status=active]:bg-card data-[status=active]:text-foreground data-[status=active]:shadow-low"
          >
            <Icon className="size-5" strokeWidth={ICON_STROKE} aria-hidden />
            <span className="truncate">{label}</span>
          </Link>
        ))}
      </nav>

      <p className="mt-auto px-3 text-xs leading-relaxed text-muted-foreground">
        Каждое действие ведёт к результату.
      </p>
    </aside>
  );
}
