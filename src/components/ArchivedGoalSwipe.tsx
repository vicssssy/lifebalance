import { useRef, useState, type PointerEvent, type ReactNode } from "react";
import { Trash } from "iconoir-react";

const REVEAL = 96;

/** Archive-only gesture. This component can request confirmation, never delete data. */
export function ArchivedGoalSwipe({
  children,
  name,
  onRequestDelete,
}: {
  children: ReactNode;
  name: string;
  onRequestDelete: () => void;
}) {
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const gesture = useRef<{
    x: number;
    y: number;
    start: number;
    distance: number;
    horizontal: boolean;
  } | null>(null);
  const suppressClick = useRef(false);
  const requestConfirmation = () => {
    setOffset(0);
    onRequestDelete();
  };
  const endGesture = (event: PointerEvent<HTMLDivElement>, cancelled = false) => {
    const current = gesture.current;
    gesture.current = null;
    setDragging(false);
    if (!current?.horizontal) return;
    suppressClick.current = true;
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
    if (cancelled) {
      setOffset(current.start);
      return;
    }
    const fullSwipe = Math.min(event.currentTarget.clientWidth * 0.65, 240);
    if (current.distance >= fullSwipe && event.clientX < current.x - 40) requestConfirmation();
    else setOffset(current.distance >= REVEAL / 2 ? REVEAL : 0);
  };

  return (
    <div className="relative isolate overflow-hidden rounded-[30px] bg-destructive">
      <button
        type="button"
        aria-label={`Удалить цель «${name}»`}
        className="focus-ring absolute inset-y-0 right-0 flex w-24 flex-col items-center justify-center gap-2 rounded-r-[30px] bg-destructive text-white"
        onFocus={() => setOffset(REVEAL)}
        onClick={requestConfirmation}
      >
        <Trash className="size-8" strokeWidth={1.8} aria-hidden />
        <span className="text-sm font-semibold">Удалить</span>
      </button>
      <div
        role="group"
        tabIndex={0}
        aria-label={`Цель «${name}». Смахните влево для удаления.`}
        className={`focus-ring relative select-none rounded-[30px] bg-background motion-reduce:transition-none ${dragging ? "" : "transition-transform duration-200 ease-out"}`}
        style={{ transform: `translateX(-${offset}px)`, touchAction: "pan-y" }}
        onKeyDown={(event) => {
          if (event.target !== event.currentTarget) return;
          if (event.key === "ArrowLeft") {
            event.preventDefault();
            setOffset(REVEAL);
          }
          if (event.key === "ArrowRight" || event.key === "Escape") {
            event.preventDefault();
            setOffset(0);
          }
          if (event.key === "Delete" || event.key === "Backspace") {
            event.preventDefault();
            requestConfirmation();
          }
        }}
        onPointerDown={(event) => {
          if (!event.isPrimary || event.button !== 0) return;
          suppressClick.current = false;
          gesture.current = {
            x: event.clientX,
            y: event.clientY,
            start: offset,
            distance: offset,
            horizontal: false,
          };
        }}
        onPointerMove={(event) => {
          const current = gesture.current;
          if (!current) return;
          const dx = current.x - event.clientX,
            dy = Math.abs(event.clientY - current.y);
          if (!current.horizontal) {
            if (dy > 8 && dy >= Math.abs(dx)) {
              gesture.current = null;
              return;
            }
            if (Math.abs(dx) < 8 || Math.abs(dx) <= dy * 1.2) return;
            current.horizontal = true;
            event.currentTarget.setPointerCapture(event.pointerId);
            setDragging(true);
          }
          current.distance = Math.max(
            0,
            Math.min(event.currentTarget.clientWidth * 0.9, current.start + dx),
          );
          setOffset(current.distance);
        }}
        onPointerUp={(event) => endGesture(event)}
        onPointerCancel={(event) => endGesture(event, true)}
        onClickCapture={(event) => {
          if (suppressClick.current) {
            event.preventDefault();
            event.stopPropagation();
            suppressClick.current = false;
          }
        }}
        onDragStart={(event) => event.preventDefault()}
      >
        {children}
      </div>
    </div>
  );
}
