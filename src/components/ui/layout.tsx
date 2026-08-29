import { useState, type ReactNode } from "react";
import { EditPencil } from "iconoir-react";
import { Button } from "@/components/ui/button";
import { Textarea, Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * Единый контейнер контента страницы: комфортные боковые отступы,
 * safe-area и предсказуемая максимальная ширина. Все экраны используют
 * только его — отдельные padding'и по экранам не добавляем.
 */
export function PageContainer({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("page-gutter mx-auto w-full max-w-md", className)}>{children}</div>;
}

/** Крупный заголовок страницы: надзаголовок, заголовок, подпись, действие справа. */
export function PageHeading({
  eyebrow,
  title,
  subtitle,
  right,
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  right?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3.5", className)}>
      <div className="min-w-0">
        {eyebrow ? <p className="day-part-title mb-1.5">{eyebrow}</p> : null}
        <h1 className="text-[clamp(2.05rem,8.6vw,2.5rem)] font-bold leading-[1.02] tracking-[-0.045em] text-foreground">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-3 text-[17px] font-medium leading-snug tracking-[-0.012em] text-muted-foreground">
            {subtitle}
          </p>
        ) : null}
      </div>
      {right ? <div className="shrink-0">{right}</div> : <span />}
    </div>
  );
}

/** Смысловой блок контента с необязательным заголовком и действием. */
export function Section({
  title,
  action,
  children,
  className,
}: {
  title?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-3", className)}>
      {title || action ? (
        <div className="flex min-h-6 items-center justify-between gap-3">
          {title ? <h2 className="day-part-title">{title}</h2> : <span />}
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}

/** Компактный факт о элементе: время, длительность, формат. */
export function MetaChip({
  icon: Icon,
  children,
}: {
  icon?: React.ElementType;
  children: ReactNode;
}) {
  return (
    <span className="inline-flex min-h-7 items-center gap-1.5 rounded-full border border-border bg-card px-2.5 text-xs font-medium text-muted-foreground">
      {Icon ? <Icon className="size-3.5 shrink-0" strokeWidth={1.75} aria-hidden /> : null}
      <span className="tabular-nums">{children}</span>
    </span>
  );
}

/** Мягкий разделитель между смысловыми блоками. */
export function Divider({ className }: { className?: string }) {
  return <hr className={cn("border-0 border-t border-white/80", className)} />;
}

/**
 * Раздел с независимым редактированием: спокойный текст + деликатная
 * кнопка «Изменить», которая раскрывает поле, не меняя структуру экрана.
 */
export function EditableSection({
  title,
  value,
  placeholder,
  emptyText = "Пока не заполнено",
  multiline = true,
  valueClassName,
  onSave,
  saving,
  editable = true,
  children,
}: {
  title: ReactNode;
  value: string;
  placeholder: string;
  emptyText?: string;
  multiline?: boolean;
  valueClassName?: string;
  onSave: (next: string) => void | Promise<unknown>;
  saving?: boolean;
  editable?: boolean;
  children?: ReactNode;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const start = () => {
    setDraft(value);
    setEditing(true);
  };

  const submit = async () => {
    await onSave(draft.trim());
    setEditing(false);
  };

  return (
    <Section
      title={title}
      action={
        editing || !editable ? null : (
          <button
            type="button"
            onClick={start}
            className="focus-ring -mr-2 inline-flex min-h-9 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold text-primary/75 transition-colors duration-200 hover:bg-white/65 hover:text-primary"
          >
            <EditPencil className="size-3.5" aria-hidden />
            Изменить
          </button>
        )
      }
    >
      {editing ? (
        <div className="space-y-2.5">
          {multiline ? (
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={placeholder}
              rows={3}
              autoFocus
            />
          ) : (
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={placeholder}
              autoFocus
            />
          )}
          <div className="flex gap-2">
            <Button size="sm" onClick={submit} loading={saving ?? false}>
              Сохранить
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
              Отмена
            </Button>
          </div>
        </div>
      ) : value ? (
        <p className={cn("text-base leading-relaxed text-foreground", valueClassName)}>{value}</p>
      ) : (
        <p className="text-sm leading-relaxed text-muted-foreground">{emptyText}</p>
      )}
      {children}
    </Section>
  );
}
