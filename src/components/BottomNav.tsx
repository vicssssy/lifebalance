import { Link, useNavigate } from "@tanstack/react-router";
import { Plus } from "iconoir-react";
import { NAV_LEFT, NAV_RIGHT, type NavItem } from "@/components/nav-items";
import { ICON_STROKE } from "@/components/ui/icon";

function BottomNavItem({ to, label, icon: Icon }: NavItem) {
  return (
    <Link
      to={to}
      className="touch-target group flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-[20px] py-1.5 text-foreground/55 transition-[background-color,color,transform] duration-200 ease-out focus-ring data-[status=active]:bg-white/55 data-[status=active]:text-primary"
      activeOptions={{ exact: false }}
    >
      <span className="flex size-7 items-center justify-center transition-transform duration-200 ease-out group-data-[status=active]:-translate-y-0.5 group-active:scale-90">
        <Icon className="size-[20px]" strokeWidth={ICON_STROKE} aria-hidden />
      </span>
      <span className="whitespace-nowrap text-[9px] font-semibold leading-none tracking-[-0.025em] min-[360px]:text-[10px]">
        {label}
      </span>
    </Link>
  );
}

/** Мобильная нижняя навигация: Сегодня | Календарь | ＋ | Мои цели | Рефлексия */
export function BottomNav() {
  const navigate = useNavigate();

  return (
    <nav
      className="phone-bottom-nav control-glass fixed bottom-[max(8px,env(safe-area-inset-bottom))] left-1/2 z-40 w-[calc(100%-16px)] max-w-[414px] -translate-x-1/2 rounded-[30px]"
      aria-label="Основная навигация"
    >
      <div className="flex min-w-0 items-stretch px-1.5 py-1.5">
        {NAV_LEFT.map((item) => (
          <BottomNavItem key={item.to} {...item} />
        ))}

        <div className="flex flex-1 items-start justify-center">
          <button
            type="button"
            aria-label="Добавить"
            onClick={() => navigate({ to: "/new" })}
            className="focus-ring -mt-6 flex size-[62px] items-center justify-center rounded-full border-[4px] border-white/80 bg-[linear-gradient(145deg,#755fff,#4e36dc)] text-primary-foreground shadow-[0_14px_32px_rgb(83_62_224_/_0.38),inset_0_1px_1px_rgb(255_255_255_/_0.38)] transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-high active:scale-95"
          >
            <Plus className="size-[28px]" strokeWidth={1.9} aria-hidden />
          </button>
        </div>

        {NAV_RIGHT.map((item) => (
          <BottomNavItem key={item.to} {...item} />
        ))}
      </div>
    </nav>
  );
}
