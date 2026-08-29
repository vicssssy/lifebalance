import type { Occurrence } from "@/domain/types";

/** Спокойная сводка дня: сколько выполнено и что дальше. */
export function DayProgress({ occurrences }: { occurrences: Occurrence[] }) {
  const total = occurrences.length;
  if (!total) return null;

  const done = occurrences.filter((o) => o.completed).length;
  const next = occurrences.find((o) => !o.completed) ?? null;
  const percent = Math.round((done / total) * 100);

  return (
    <section className="animate-rise mb-8 rounded-[30px] border border-white/80 bg-white/72 p-5 shadow-mid backdrop-blur-2xl">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-base font-semibold text-foreground">
          Выполнено <span className="tabular-nums">{done}</span> из{" "}
          <span className="tabular-nums">{total}</span>
        </p>
        <p className="rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold tabular-nums text-secondary-foreground">
          {percent}%
        </p>
      </div>

      <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>

      <p className="mt-3 truncate text-sm font-medium text-muted-foreground">
        {next ? <>Дальше: {next.action.name}</> : <>День закрыт — всё выполнено</>}
      </p>
    </section>
  );
}
