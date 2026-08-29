import { Calendar, HomeSimple, JournalPage, Trophy } from "iconoir-react";
import type { AppIcon } from "@/components/ui/icon";

export type NavItem = { to: string; label: string; icon: AppIcon };

/** Утверждённая навигация: Сегодня | Календарь | ＋ | Мои цели | Рефлексия */
export const NAV_LEFT: NavItem[] = [
  { to: "/today", label: "Сегодня", icon: HomeSimple },
  { to: "/calendar", label: "Календарь", icon: Calendar },
];

export const NAV_RIGHT: NavItem[] = [
  { to: "/goals", label: "Мои цели", icon: Trophy },
  { to: "/reflection", label: "Рефлексия", icon: JournalPage },
];

export const NAV_ALL: NavItem[] = [...NAV_LEFT, ...NAV_RIGHT];
