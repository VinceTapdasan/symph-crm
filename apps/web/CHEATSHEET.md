# symph-crm Design Cheatsheet

Rules are **NON NEGOTIABLE**. Every component, every PR.

---

## Typography

| Use case | Class | Weight |
|---|---|---|
| All body / UI text | `text-sm` (14px) | `font-normal` or `font-medium` |
| Metadata, timestamps | `text-xs` (12px) | `font-normal` only |
| Section headings | `text-base` (16px) | `font-medium` |
| Page headings | `text-lg` (18px) | `font-semibold` ← rare |

**Semibold (`font-semibold`) is rare.** Use it for: table column headers, stat values, modal titles. Not for buttons, labels, nav items, or decorative purposes.

**`font-bold` and above are banned from all UI chrome.**

---

## Icons

| Context | Size | `strokeWidth` |
|---|---|---|
| Decorative / empty state / large | 18–20px | `1.0` |
| Standard UI (buttons, nav, topbar) | **16px** | **`1.2`** |
| Status / emphasis / primary CTA | 16px | `1.5` |
| Tight / inline (badges, dense rows) | 14px | `1.2` |

**Default: `width={16} height={16} strokeWidth={1.2}`**

`strokeWidth={2}` and above are banned. They read as heavy and inconsistent.

---

## Quick Copy-Paste

```tsx
// Standard icon
<svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round">

// Emphasis icon (CTA, status)
<svg width={16} height={16} ... strokeWidth={1.5}>

// Body text
<p className="text-sm font-normal text-foreground">

// Secondary/muted text
<span className="text-sm font-normal text-muted-foreground">

// Label (form, table header)
<label className="text-sm font-medium text-foreground">

// Stat value / metric
<span className="text-lg font-semibold text-foreground">

// Timestamp / metadata
<time className="text-xs text-muted-foreground">
```

---

## What to avoid

```tsx
// WRONG — too heavy
strokeWidth={2}
strokeWidth={2.5}

// WRONG — overused semibold
<button className="text-sm font-semibold">Cancel</button>

// WRONG — bold banned
<p className="font-bold">

// WRONG — wrong base size
<p className="text-xs">Body copy</p>
<p className="text-base">Regular UI text</p>
```

---

## Color rule (reminder)

Zero dominant hue in UI chrome. Only semantic colors:

| Token | Use |
|---|---|
| `text-foreground` | Primary text |
| `text-muted-foreground` | Secondary / metadata |
| `bg-muted` | Subtle backgrounds, chips |
| `text-success` / `bg-success-dim` | Positive states |
| `text-danger` / `bg-danger-dim` | Negative states |
| `text-warning` / `bg-warning-dim` | Caution states |
| `text-info` / `bg-info-dim` | Informational |
