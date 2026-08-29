/**
 * Единый источник правды дизайн-системы.
 * Значения здесь зеркалят CSS-переменные в `src/styles.css`
 * (@theme / :root) — меняем в паре, чтобы токены не расходились.
 *
 * Бренд-цвета намеренно НЕ придуманы: `brandPrimary` / `brandAccent`
 * указывают на нейтральную шкалу до момента, когда бренд определят явно.
 */

/** Нейтральная тёплая шкала 0–1000 (премиальный светлый фундамент). */
export const neutral = {
  0: "oklch(1 0 0)",
  25: "oklch(0.99 0.002 85)",
  50: "oklch(0.985 0.003 85)",
  100: "oklch(0.973 0.004 85)",
  200: "oklch(0.945 0.005 85)",
  300: "oklch(0.905 0.006 85)",
  400: "oklch(0.84 0.007 85)",
  500: "oklch(0.72 0.008 85)",
  600: "oklch(0.6 0.008 85)",
  700: "oklch(0.5 0.008 85)",
  800: "oklch(0.38 0.008 85)",
  900: "oklch(0.28 0.008 85)",
  1000: "oklch(0.19 0.006 85)",
} as const;

/** Семантические токены. Бренд пока = нейтраль. */
export const semantic = {
  brandPrimary: "#6047E8",
  brandPrimaryForeground: "#FFFFFF",
  brandAccent: "#EEEAFE",
  brandAccentForeground: "#5540D9",
  background: "#F6F7FC",
  foreground: "#171A2A",
  surface: neutral[100],
  card: neutral[0],
  border: "#E4E5EF",
  muted: "#EFF0F7",
  mutedForeground: "#74788F",
  hint: "#9093A6",
} as const;

/** Радиусы: sm 6 / md 10 / xl 16 px. */
export const radius = {
  sm: "6px",
  md: "10px",
  xl: "28px",
} as const;

/** Строгая сетка 8pt (половинный шаг 4px для мелких зазоров). */
export const spacing = {
  0.5: "4px",
  1: "8px",
  2: "16px",
  3: "24px",
  4: "32px",
  5: "40px",
  6: "48px",
  8: "64px",
} as const;

/** Мягкие «apple-style» тени: low / mid / high. */
export const shadow = {
  low: "0 6px 18px rgb(35 33 72 / 0.045)",
  mid: "0 16px 38px rgb(35 33 72 / 0.085)",
  high: "0 24px 64px rgb(35 33 72 / 0.16)",
} as const;

/** Inter variable, веса 400 / 500 / 600, шкала XS→XL. */
export const typography = {
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif',
  weight: { regular: 400, medium: 500, semibold: 600, bold: 700 },
  scale: {
    xs: { size: "0.75rem", lineHeight: "1rem" },
    sm: { size: "0.8125rem", lineHeight: "1.125rem" },
    base: { size: "0.9375rem", lineHeight: "1.375rem" },
    lg: { size: "1.0625rem", lineHeight: "1.5rem" },
    xl: { size: "1.25rem", lineHeight: "1.625rem" },
    "2xl": { size: "1.5rem", lineHeight: "1.875rem" },
    "3xl": { size: "1.875rem", lineHeight: "2.25rem" },
    "4xl": { size: "2.25rem", lineHeight: "2.5rem" },
  },
} as const;

/** Минимальный тач-таргет по мобильным гайдлайнам. */
export const touchTarget = "44px";

export const theme = {
  neutral,
  semantic,
  radius,
  spacing,
  shadow,
  typography,
  touchTarget,
} as const;

export type Theme = typeof theme;
