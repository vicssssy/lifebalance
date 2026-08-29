import { useState } from "react";
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { CalendarPlus, CircleSpark, CloudSunny, HalfMoon, SunLight } from "iconoir-react";
import type { AppIcon } from "@/components/ui/icon";
import { toast } from "sonner";
import { markActionCompleted, unmarkActionCompleted } from "@/data/completions";
import { updateSchedule } from "@/data/schedules";
import { DAY_PARTS, type DayPart } from "@/domain/constants";
import { groupByDayPart } from "@/domain/occurrences";
import { dayPartFor } from "@/domain/schedule";
import type { Occurrence } from "@/domain/types";
import { useAuth } from "@/hooks/useAuth";
import { usePlannerMutation } from "@/hooks/useAppData";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionTitle } from "@/components/ui/surface";
import { cn } from "@/lib/utils";
import { OccurrenceCard } from "./OccurrenceCard";
import { isLocalPreviewAuthBypassEnabled } from "@/lib/local-preview";

/** Время по умолчанию для категории дня при переносе. */
const DAY_PART_TIME: Record<DayPart, string | null> = {
  morning: "08:00",
  day: "13:00",
  evening: "19:00",
  extra: null,
};

const DAY_PART_ICON: Record<DayPart, AppIcon> = {
  morning: CloudSunny,
  day: SunLight,
  evening: HalfMoon,
  extra: CircleSpark,
};

function DraggableCard({
  occurrence,
  onToggle,
}: {
  occurrence: Occurrence;
  onToggle: (occurrence: Occurrence, next: boolean) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: occurrence.key,
  });

  return (
    <OccurrenceCard
      occurrence={occurrence}
      onToggle={onToggle}
      drag={{
        ref: setNodeRef,
        style: transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : {},
        isDragging,
        handleProps: { ...attributes, ...listeners },
      }}
    />
  );
}

function DropSection({
  part,
  children,
  active,
}: {
  part: DayPart;
  children: React.ReactNode;
  active: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `part:${part}` });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded-xl transition-colors duration-200",
        active && "border border-dashed border-border/70 p-2",
        isOver && "border-primary/60 bg-secondary/60",
      )}
    >
      {children}
    </div>
  );
}

/** Утро → День → Вечер → Дополнительно. Пустые категории видны только при переносе. */
export function DayPlan({
  occurrences,
  emptyText,
  onPreviewOccurrencesChange,
}: {
  occurrences: Occurrence[];
  emptyText: string;
  onPreviewOccurrencesChange?: (occurrences: Occurrence[]) => void;
}) {
  const { userId } = useAuth();
  const [dragging, setDragging] = useState(false);
  const [localOccurrences, setLocalOccurrences] = useState(occurrences);
  const localPreview = isLocalPreviewAuthBypassEnabled();
  const displayedOccurrences = localPreview
    ? onPreviewOccurrencesChange
      ? occurrences
      : localOccurrences
    : occurrences;
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
  );

  const toggle = usePlannerMutation((input: { occurrence: Occurrence; next: boolean }) =>
    input.next
      ? markActionCompleted({
          userId: userId!,
          actionId: input.occurrence.action.id,
          scheduleId: input.occurrence.schedule.id,
          date: input.occurrence.date,
        })
      : unmarkActionCompleted({
          scheduleId: input.occurrence.schedule.id,
          date: input.occurrence.date,
        }),
  );

  const move = usePlannerMutation((input: { scheduleId: string; startTime: string | null }) =>
    updateSchedule(input.scheduleId, { start_time: input.startTime }),
  );

  const grouped = groupByDayPart(displayedOccurrences);
  const sections = dragging
    ? DAY_PARTS.map((p) => ({
        key: p.key,
        title: p.title,
        items: grouped.find((s) => s.key === p.key)?.items ?? [],
      }))
    : grouped;

  if (!displayedOccurrences.length && !dragging) {
    return <EmptyState icon={CalendarPlus} title="Пока пусто" description={emptyText} />;
  }

  const setPreviewOccurrences = (next: Occurrence[]) => {
    if (onPreviewOccurrencesChange) onPreviewOccurrencesChange(next);
    else setLocalOccurrences(next);
  };

  const handleToggle = (occurrence: Occurrence, next: boolean) => {
    if (localPreview) {
      setPreviewOccurrences(
        displayedOccurrences.map((item) =>
          item.key === occurrence.key ? { ...item, completed: next, skipped: false } : item,
        ),
      );
      toast.success(next ? "Действие выполнено" : "Отметка снята");
      return;
    }
    toggle.mutate({ occurrence, next });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setDragging(false);
    const overId = String(event.over?.id ?? "");
    if (!overId.startsWith("part:")) return;
    const target = overId.slice(5) as DayPart;
    const occ = displayedOccurrences.find((o) => o.key === event.active.id);
    if (!occ) return;
    if (dayPartFor(occ.startTime) === target) return;
    if (localPreview) {
      const startTime = DAY_PART_TIME[target];
      setPreviewOccurrences(
        displayedOccurrences.map((item) =>
          item.key === occ.key
            ? {
                ...item,
                startTime,
                schedule: { ...item.schedule, start_time: startTime },
              }
            : item,
        ),
      );
      toast.success(
        `${occ.action.name} → ${DAY_PARTS.find((part) => part.key === target)?.title ?? ""}`,
      );
      return;
    }
    move.mutate(
      { scheduleId: occ.schedule.id, startTime: DAY_PART_TIME[target] },
      {
        onSuccess: () =>
          toast.success(
            `${occ.action.name} → ${DAY_PARTS.find((p) => p.key === target)?.title ?? ""}`,
          ),
      },
    );
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={() => setDragging(true)}
      onDragCancel={() => setDragging(false)}
      onDragEnd={handleDragEnd}
    >
      <div className="animate-rise space-y-4">
        {sections.map((section) => {
          const PartIcon = DAY_PART_ICON[section.key];
          return (
            <section key={section.key}>
              <div className="mb-3 flex items-center gap-2.5 px-1 text-muted-foreground">
                <PartIcon className="size-5 text-primary/65" strokeWidth={1.75} aria-hidden />
                <SectionTitle className="block uppercase tracking-[0.09em]">
                  {section.title}
                </SectionTitle>
              </div>
              <DropSection part={section.key} active={dragging}>
                <div className="space-y-2.5">
                  {section.items.map((occ) => (
                    <DraggableCard key={occ.key} occurrence={occ} onToggle={handleToggle} />
                  ))}
                </div>
                {dragging && !section.items.length ? (
                  <p className="py-3 text-center text-xs text-muted-foreground">Перенести сюда</p>
                ) : null}
              </DropSection>
            </section>
          );
        })}
      </div>
    </DndContext>
  );
}

export type { Occurrence };
