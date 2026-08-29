import { Link, useNavigate } from "@tanstack/react-router";
import { Plus } from "iconoir-react";
import { NAV_LEFT, NAV_RIGHT, type NavItem } from "@/components/nav-items";
import { ICON_STROKE } from "@/components/ui/icon";

function BottomNavItem({ to, label, icon: Icon }: NavItem) {
  return (
    <Link
      to={to}
      className="touch-target group flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-2xl py-2 text-muted-foreground transition-[color,transform] duration-200 ease-out focus-ring data-[status=active]:text-primary"
      activeOptions={{ exact: false }}
    >
      <span className="flex size-7 items-center justify-center transition-transform duration-200 ease-out group-data-[status=active]:-translate-y-0.5 group-active:scale-90">
        <Icon className="size-[21px]" strokeWidth={ICON_STROKE} aria-hidden />
      </span>
      <span className="whitespace-nowrap text-[9px] font-semibold leading-none tracking-[-0.03em] min-[360px]:text-[11px]">
        {label}
      </span>
    </Link>
  );
}

/** Мобильная нижняя навигация: Сегодня | Календарь | ＋ | Мои цели | Рефлексия */
export function BottomNav() {
  const navigate = useNavigate();

  return (
    <nav className="phone-bottom-nav fixed inset-x-0 bottom-3 z-40 mx-auto w-[calc(100%-0.75rem)] max-w-[406px] rounded-[32px] border border-white/85 bg-white/76 shadow-[0_18px_54px_rgb(35_33_72_/_0.18)] backdrop-blur-[32px]">
      <div className="safe-bottom flex min-w-0 items-stretch px-1.5 pt-2">
        {NAV_LEFT.map((item) => (
          <BottomNavItem key={item.to} {...item} />
        ))}

        <div className="flex flex-1 items-start justify-center">
          <button
            type="button"
            aria-label="Добавить"
            onClick={() => navigate({ to: "/new" })}
            className="focus-ring -mt-7 flex size-16 items-center justify-center rounded-full border-[5px] border-[#f5f5fb] bg-primary text-primary-foreground shadow-[0_14px_34px_rgb(96_71_232_/_0.36)] transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-high active:scale-95"
          >
            <Plus className="size-[29px]" strokeWidth={2} aria-hidden />
          </button>
        </div>

        {NAV_RIGHT.map((item) => (
          <BottomNavItem key={item.to} {...item} />
        ))}
      </div>
    </nav>
  );
}
