// Design system tokens — NON NEGOTIABLE
// These values define the visual language of symph-crm.
// Every component must conform to these rules.

// ─── Typography ───────────────────────────────────────────────────────────────

export const FONT_SIZE = {
  base: '14px',    // text-sm — all body/content/UI text
  sm: '12px',      // text-xs — metadata, timestamps, captions ONLY
  lg: '16px',      // text-base — section headings, modal titles
  xl: '18px',      // text-lg — page headings (rare)
} as const

// Regular (400) and medium (500) cover 99% of all UI.
// Semibold (600) only for: table headers, stat values, critical labels.
// Bold (700+) is BANNED from UI chrome.
export const FONT_WEIGHT = {
  regular: '400',    // font-normal — default body
  medium: '500',     // font-medium — labels, nav items, button text
  semibold: '600',   // font-semibold — RARE: headers, metric values only
} as const

// ─── Icons ────────────────────────────────────────────────────────────────────

export const ICON_SIZE = {
  sm: 14,    // tight contexts: badges, inline text, dense tables
  base: 16,  // ALL standard UI icons — the default
  lg: 18,    // sidebar nav icons, empty states
  xl: 20,    // feature illustrations (rare)
} as const

// Match stroke weight to visual weight of the context.
// 1.0 → large/decorative icons (illustrations, empty states)
// 1.2 → standard interactive UI icons (buttons, sidebar, topbar)
// 1.5 → emphasis icons (status indicators, primary CTAs)
export const ICON_STROKE = {
  light: 1.0,    // decorative, large icons
  base: 1.2,     // standard UI — the default
  strong: 1.5,   // emphasis, interactive, status
} as const

// ─── Quick reference ──────────────────────────────────────────────────────────

// CORRECT:
//   <svg width={ICON_SIZE.base} height={ICON_SIZE.base} strokeWidth={ICON_STROKE.base} />
//   <p className="text-sm font-medium">Label</p>
//   <span className="text-sm font-normal text-muted-foreground">Body</span>

// WRONG:
//   strokeWidth={2}  ← too heavy
//   className="text-xs font-bold"  ← both violations
//   className="text-base font-semibold"  ← semibold overuse
