import type { CSSProperties, HTMLAttributes, Ref } from "react";
import { Link } from "@tanstack/react-router";
import {
  Check,
  CheckSquare,
  Clock,
  MoreVert,
  Repeat,
  SkipNext,
  Sparks,
  TaskList,
} from "iconoir-react";
import type { AppIcon } from "@/components/ui/icon";
import { ACTION_FORMAT_NAME, type ActionType } from "@/domain/constants";
import { formatDuration, formatTime } from "@/domain/schedule";
import type { Occurrence } from "@/domain/types";
import { cn } from "@/lib/utils";

export interface DragHandleProps {
  ref: Ref<HTMLElement>;
  style: CSSProperties;
  isDragging: boolean;
  handleProps: HTMLAttributes<HTMLElement>;
}

const ACTION_ICON: Record<ActionType, AppIcon> = {
  ritual: Sparks,
  regular_action: Repeat,
  task: CheckSquare,
  time_slot: Clock,
  preparation: TaskList,
};

/** Карточка действия: чекбокс, название, время, формат и ручка переноса. */
export function OccurrenceCard({
  occurrence,
  onToggle,
  drag,
  maxTitleLines,
}: {
  occurrence: Occurrence;
  onToggle?: (occurrence: Occurrence, next: boolean) => void;
  drag?: DragHandleProps;
  maxTitleLines?: 2;
}) {
  const { action, ritualProgress, completed, skipped, startTime, date } = occurrence;
  const time = formatTime(startTime);
  const duration = formatDuration(occurrence.durationSeconds);
  const ActionIcon = ACTION_ICON[action.type];

  let status = "";
  if (skipped) {
    status = "Пропущено";
  } else if (action.type === "ritual" && ritualProgress && !completed) {
    status = `${ritualProgress.done}/${ritualProgress.total}`;
  }
  const muted = completed || skipped;
  const metadata = [duration, status].filter(Boolean).join(" · ");

  return (
    <div
      ref={drag?.ref as Ref<HTMLDivElement>}
      style={drag?.style}
      className={cn(
        "grid w-full grid-cols-[44px_minmax(0,1fr)] items-start gap-1 transition-[transform,opacity] duration-200",
        completed && "opacity-85",
        skipped && "opacity-60",
        drag?.isDragging && "relative z-20 shadow-mid",
      )}
    >
      <div className="relative flex min-h-full flex-col items-center">
        <span
          className="flex size-10 items-center justify-center rounded-full border border-white/80 bg-primary text-primary-foreground shadow-[0_12px_26px_rgb(96_71_232_/_0.28)]"
          aria-hidden
        >
          <ActionIcon className="size-[18px]" strokeWidth={1.8} />
        </span>
        {time ? (
          <span className="mt-1.5 text-center text-[12px] font-medium leading-tight tabular-nums text-muted-foreground">
            {time}
          </span>
        ) : null}
      </div>

      <div
        className={cn(
          "flex min-w-0 items-start rounded-[24px] border border-white/85 bg-white/74 shadow-[0_18px_44px_rgb(38_38_70_/_0.08)] backdrop-blur-2xl transition-[transform,box-shadow] duration-200 active:scale-[0.99]",
          muted && "bg-white/55 shadow-low",
          skipped && "border-dashed border-border/80",
        )}
      >
        <Link
          to="/action/$actionId"
          params={{ actionId: action.id }}
          search={{ date, scheduleId: occurrence.schedule.id }}
          className="focus-ring min-w-0 flex-1 rounded-[24px] px-3 py-2.5"
        >
          <p className="text-[11px] font-semibold text-primary">
            {ACTION_FORMAT_NAME[action.type]}
          </p>
          <p
            className={cn(
              "mt-1 text-[16px] font-semibold leading-[1.22] tracking-[-0.018em]",
              maxTitleLines === 2 && "line-clamp-2",
              muted ? "text-foreground/65" : "text-foreground",
            )}
          >
            {action.name}
          </p>
          {metadata ? (
            <p className="mt-1.5 flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
              <Clock className="size-3.5 shrink-0" strokeWidth={1.8} aria-hidden />
              <span>{metadata}</span>
            </p>
          ) : null}
        </Link>

        <button
          type="button"
          aria-label={completed ? "Снять отметку выполнения" : "Отметить выполненным"}
          aria-pressed={completed}
          onClick={() => onToggle?.(occurrence, !completed)}
          disabled={!onToggle}
          className="focus-ring touch-target mr-0.5 mt-2 flex shrink-0 items-center justify-center rounded-full"
        >
          <span
            className={cn(
              "flex size-7.5 items-center justify-center rounded-full border-2 transition-[background-color,border-color,transform] duration-200",
              completed
                ? "border-primary bg-primary text-primary-foreground"
                : skipped
                  ? "border-border bg-secondary text-muted-foreground"
                  : "border-[#d8d9e4] bg-white/55 text-transparent",
            )}
          >
            {completed ? (
              <Check className="size-4" strokeWidth={2.5} aria-hidden />
            ) : skipped ? (
              <SkipNext className="size-3.5" strokeWidth={2} aria-hidden />
            ) : null}
          </span>
        </button>

        {drag ? (
          <button
            type="button"
            aria-label="Перенести действие"
            {...drag.handleProps}
            className="focus-ring touch-target flex shrink-0 cursor-grab touch-none items-center justify-center rounded-full text-muted-foreground/70 transition-colors hover:text-primary"
          >
            <MoreVert className="size-4" strokeWidth={1.75} aria-hidden />
          </button>
        ) : null}
      </div>
    </div>
  );
}
