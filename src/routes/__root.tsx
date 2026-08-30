import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { IconoirProvider } from "iconoir-react";
import { Toaster } from "@/components/ui/sonner";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="phone-app-shell flex items-center justify-center bg-background px-6">
      <div className="glass-surface max-w-sm rounded-[34px] px-6 py-10 text-center">
        <h1 className="text-3xl">Страница не найдена</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Возможно, ссылка устарела или страница была перемещена.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="focus-ring inline-flex items-center justify-center rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-[0_12px_28px_rgb(96_71_232_/_0.28)]"
          >
            На главную
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="phone-app-shell flex items-center justify-center bg-background px-6">
      <div className="glass-surface max-w-sm rounded-[34px] px-6 py-10 text-center">
        <h1 className="text-2xl">Не удалось загрузить страницу</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Попробуй обновить или вернуться на главную.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="focus-ring inline-flex items-center justify-center rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-[0_12px_28px_rgb(96_71_232_/_0.28)]"
          >
            Обновить
          </button>
          <a
            href="/"
            className="focus-ring inline-flex items-center justify-center rounded-2xl border border-white/85 bg-white/70 px-5 py-3 text-sm font-semibold text-foreground shadow-mid backdrop-blur-2xl"
          >
            На главную
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "Путь — планирование через цели и рефлексию" },
      {
        name: "description",
        content:
          "Приложение, которое связывает сферы жизни, желаемые результаты и ежедневные действия.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "theme-color", content: "#f6f7fc" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <IconoirProvider iconProps={{ strokeWidth: 1.65 }}>
        <div className="phone-app-shell">
          {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
          <Outlet />
        </div>
        <Toaster position="top-center" />
      </IconoirProvider>
    </QueryClientProvider>
  );
}
