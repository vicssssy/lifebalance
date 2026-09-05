# UX Contract

## Product context

- Audience: русскоязычный пользователь личного мобильного планировщика.
- Primary jobs: создать цель и связанное действие; увидеть день и календарь; отметить выполнение; просмотреть цели; сохранить рефлексию.
- Target market(s): русскоязычный интерфейс; география не определяет бизнес-логику.
- Active locales: `ru`.
- Language/content register and native-review policy: утверждённая русская терминология из domain constants и существующих маршрутов; визуальный редизайн её не меняет.
- Timezone/calendar policy: текущая локальная date-only логика из `src/domain/schedule.ts`.
- Accessibility target: WCAG 2.2 AA.

## Business-context sources

| Domain / scope               | Authoritative source                                                           | Source type             | Reviewed date |
| ---------------------------- | ------------------------------------------------------------------------------ | ----------------------- | ------------- |
| Permission model             | `src/routes/_authenticated/route.tsx`, скрытая авторизация                     | Implementation contract | 2026-09-05    |
| Data lifecycle               | `src/domain/types.ts`, `src/domain/occurrences.ts`, `src/data/*`               | Domain/data contract    | 2026-09-05    |
| Deletion / retention         | goal lifecycle rules implemented in `src/data/goals.ts` and occurrence history | Domain contract         | 2026-09-05    |
| Billing / payment            | Not applicable                                                                 | —                       | 2026-09-05    |
| Legal / regulatory copy      | Not applicable                                                                 | —                       | 2026-09-05    |
| Market / content conventions | `src/domain/constants.ts`, route copy                                          | Product implementation  | 2026-09-05    |

## Visual contract

- Project `DESIGN.md`: `DESIGN.md`.
- Token ownership model: existing runtime canonical, documented by `DESIGN.md`.
- Runtime design-system/token source: `src/styles.css` paired with `src/theme.ts`.
- Mapping/export/adapters: Tailwind theme variables plus shared components in `src/components/ui`.
- Token drift gate: lint `DESIGN.md`, then review/build both runtime token files together.
- Supported themes: light only; forced-colors remains system-operable.
- Design-context owner/review policy: application-wide visual changes update shared tokens/primitives and this contract.

## Canonical UI Map

| Capability     | Canonical owner                                        | Source of truth                                                | Allowed variants  | Verification                      |
| -------------- | ------------------------------------------------------ | -------------------------------------------------------------- | ----------------- | --------------------------------- |
| Select/Listbox | native controls with Radix UI where already used       | `src/components/planning.tsx`, `src/components/ui/select.tsx`  | native / authored | keyboard + popup                  |
| Date           | native date/time controls with authored calendar views | `src/components/planning.tsx`, `src/components/pickers.tsx`    | native / authored | Russian locale + keyboard/pointer |
| Form           | `ActionForm`, field primitives                         | `src/components/ActionForm.tsx`, `src/components/ui/field.tsx` | create / edit     | full flow                         |
| Scrollbar      | global stylesheet                                      | `src/styles.css`                                               | document / sheet  | computed style + browser          |
| Toast          | Sonner wrapper                                         | `src/components/ui/sonner.tsx`                                 | success / error   | live region + browser             |
| CRUD           | data functions and route mutations                     | `src/data/*`, authenticated routes                             | return / stay     | full flow                         |

## Component behavior

| Component   | Default                    | Hover           | Focus            | Active       | Disabled              | Busy            | Error             |
| ----------- | -------------------------- | --------------- | ---------------- | ------------ | --------------------- | --------------- | ----------------- |
| Button      | semantic material          | luminance lift  | visible ring     | slight scale | lower contrast, inert | stable spinner  | inline/toast      |
| Icon button | 44 px target               | tint            | visible ring     | slight scale | inert                 | stable          | inline/toast      |
| Input       | light content material     | stronger border | primary ring     | n/a          | muted                 | form-owned      | inline            |
| Textarea    | same as input              | stronger border | primary ring     | n/a          | muted                 | form-owned      | inline            |
| Table/list  | readable standard material | local highlight | row/action focus | no reflow    | contextual            | reserved loader | owned empty/error |

## Dataset navigation

- Admin tables: not applicable.
- Exploratory lists: render existing bounded planner lists.
- URL state: life-area goal filter and action context remain in existing search params.
- Empty/no-results/error/loading treatment: shared `EmptyState`, app-owned loading copy and root error boundaries.
- Back/scroll restoration: preserve TanStack Router behavior and current route destinations.

## Flow ledger

| Operation           | Trigger                            | Pending                     | Success destination   | Success feedback | Failure recovery                        | Focus outcome               | Source ref              |
| ------------------- | ---------------------------------- | --------------------------- | --------------------- | ---------------- | --------------------------------------- | --------------------------- | ----------------------- |
| Create action       | `Сохранить`                        | stable disabled/busy button | Today                 | toast            | retain form + toast error               | route heading               | `ActionForm`, new route |
| Edit action         | `Сохранить`                        | stable disabled/busy button | action detail         | toast            | retain form + toast error               | detail heading              | action route            |
| Complete occurrence | completion control                 | mutation pending            | same list or Today    | toast            | rollback by query invalidation + toast  | route content               | planner mutation        |
| Close goal          | `Результат достигнут` / `Отменено` | button busy                 | Goals archive state   | toast            | keep goal active + toast/error boundary | goal list                   | goal lifecycle logic    |
| Save reflection     | `Сохранить рефлексию`              | stable busy button          | same month            | toast            | retain answers + toast error            | form context                | reflection route        |
| Cancel/back         | `Назад`, `К плану`, `Отмена`       | none                        | existing parent route | none             | n/a                                     | destination heading/trigger | route components        |

## Navigation and responsive behavior

- Route document title policy: existing localized `{Page} — Путь`; root/not-found/error remain honest.
- Route error / 403 page behavior: app-owned root not-found/error UI with route back to main; 403 not currently applicable.
- Breadcrumb/tab/route-state policy: no breadcrumbs or in-page tabs; route search params stay canonical where already used.
- Sidebar/drawer/bottom-sheet transformation: phone canvas and bottom dock at every viewport; transient choices use bounded bottom sheets.
- Responsive table strategy: not applicable; planner lists remain stacked.
- Truncation/full-value access: Today card preview clamps to two lines; full title remains available through action detail link.
- Focus restoration and sticky-obstruction policy: 44 px targets, safe-area spacing, scroll padding and visible focus ring.

## Overlays and feedback

- Dialog primitive: Radix-owned shared dialog/sheet components.
- Destructive confirmation levels: existing goal cancellation is a status transition, not deletion; no browser confirm.
- Toast placement/duration/deduplication: shared Sonner top-center within app language.
- Alert/banner scope and persistence: root boundaries and inline route states.
- Tooltip delay/dismissal: Radix defaults; icon-only actions retain accessible names.
- Unsaved-changes behavior: preserve existing behavior; no new blocking flow in this visual scope.
- Layer/z-index contract: dialog/sheet 50 > bottom navigation 40 > sticky header/actions 30 > content.

## Async and resilience

- Mutation default: existing query-mutation behavior; no change in this visual task.
- Idempotency and duplicate-submit policy: pending buttons disable duplicate activation.
- Auto-save/draft recovery: not added by this visual task.
- Offline/read-stale/write behavior: preserve current D1/API behavior.
- Retry/backoff/timeout behavior: preserve current data layer and route error recovery.
- Version conflict and multi-tab behavior: preserve current implementation.
- Session expiry/re-authentication: authentication remains intentionally hidden; visual task does not alter it.
- Stale-request cancellation/invalidation and pending-state ownership: `usePlannerMutation` remains canonical.
- Dialog/form preservation and retry after mutation failure: form state stays mounted and error is shown by toast.

## Validation

- Schema/validation layer: existing route and component guards.
- Trigger timing: before mutation through `canSave` and route validation.
- Error summary/inline policy: current inline hints plus shared toast errors.
- Server error mapping: route mutation error text.
- Sensitive-value handling: no credentials in current UI.
- `noValidate`, first-invalid focus, duplicate-submit prevention, unsaved changes, and submit recovery: preserve current behavior; pending prevents duplicate submit.

## Permission and clipboard

- Permission UI strategy: authentication screen remains hidden; no permission redesign.
- Clipboard copy policy: not applicable.
- Disabled-state explanation: existing form hint explains incomplete required input.

## Migration status

- Canonical primitives and owners: `styles.css`, `theme.ts`, `components/ui`, `AppScreen`, `ScreenHeader`, `BottomNav`, `OccurrenceCard`.
- Current risk-prioritized slices: shell/navigation → shared surfaces/forms → Today/Calendar → Goals/Reflection → nested action/create screens.
- Legacy import/token enforcement: route-local arbitrary values should be replaced only when touched and mapped to shared tokens.
- Rollout/rollback and removal gates: one coherent commit, full lint/type/build/browser verification, then GitHub and Worker publish.

## Verification

- Required static commands: design lint, project audit, Prettier check on changed files, ESLint, TypeScript no-emit, production build.
- Browser/device/locale/theme matrix: Russian light UI at 320×568, 390×844, 430×932 and desktop phone canvas.
- Accessibility checks: semantic controls, visible focus, 44 px touch targets, reduced motion and keyboard navigation.
- Component-state/visual regression coverage: Today, Calendar, Goals, Reflection, New flow, action detail/edit, sheet, empty/loading/error states.
- Canonical sibling flow used for comparison: Today and Calendar share `DayPlan`; create and edit share `ActionForm`.
- CRUD full-flow evidence: create/edit/complete/goal close/reflection behavior must remain unchanged; visual task avoids data logic.
- Failure-path evidence: root error boundary and mutation error toasts remain available.
