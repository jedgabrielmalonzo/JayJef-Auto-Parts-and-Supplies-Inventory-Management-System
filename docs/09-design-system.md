# 09 — Design System

This is the **source of truth** for visual design across the app: exact
color tokens, type scale, spacing, component states, and how they apply to
each screen. Read this before styling any new screen — don't introduce a
new color, font, or spacing value that isn't defined here; extend this file
first if a real gap comes up.

## Brand Thesis

JayJef Auto Parts & Supplies reads as a **reliable neighborhood shop, not a
tech startup**: bold red-black-white signage, chunky confident lettering,
no-nonsense layout. The UI should feel like a well-organized parts counter —
everything labeled, everything scannable at a glance, nothing decorative
getting in the way of a staff member who's mid-task and needs an answer
fast. Vintage-industrial in flavor (stenciled signage, workshop signage
boards), but rendered clean and digital — not skeuomorphic, not distressed
textures, not playful.

## Color

### Primitive Tokens

| Token | Hex | Use |
|---|---|---|
| `--red-50` | `#FDF1F1` | Faint red tint (rarely used alone) |
| `--red-100` | `#FBE4E3` | Tint backgrounds (badges, alert panels) |
| `--red-300` | `#E88685` | Disabled/light red accents |
| `--red-500` | `#E23F3C` | Rarely used directly — between 600/300 |
| `--red-600` | `#D7211E` | **Shop Red** — the brand primary |
| `--red-700` | `#B01917` | Hover/pressed red |
| `--red-800` | `#8A1210` | Active/darkest red |
| `--black-900` | `#111111` | **Shop Black** — primary text, headers |
| `--black-700` | `#3A3A3A` | Secondary text |
| `--black-500` | `#6B6B6B` | Muted text, icons |
| `--black-300` | `#9B9B9B` | Disabled text |
| `--gray-50` | `#FAFAFA` | Subtle surface tint (hover, striped rows) |
| `--gray-100` | `#F2F2F2` | Hover surface |
| `--gray-200` | `#E4E4E4` | Default borders/dividers |
| `--gray-300` | `#D1D1D1` | Stronger borders (input outlines) |
| `--white` | `#FFFFFF` | Main background, cards, negative space |
| `--green-600` | `#1E7B34` | Success (confirmed, fulfilled, stock in) |
| `--green-100` | `#E3F3E6` | Success tint background |
| `--green-700` | `#155F28` | Success text-on-tint (contrast-safe) |
| `--amber-700` | `#946200` | Warning text (low stock) |
| `--amber-100` | `#FBEEDA` | Warning tint background |
| `--blue-600` | `#3A6EA5` | Info (neutral notices only) |
| `--blue-100` | `#E7EEF5` | Info tint background |

`#D7211E` — **Shop Red** — was chosen as a warm, saturated, high-contrast
red (not pink, not orange-leaning) that reads as bold signage red at any
size, matching a chunky logo mark. Contrast against white is **~5.1:1**,
passing AA for normal text and UI components, so it's usable as text,
borders, or a solid fill with white text on top.

### Semantic Tokens

| Token | Value | Purpose |
|---|---|---|
| `--color-bg` | `--white` | Page background |
| `--color-surface` | `--white` | Cards, panels, table backgrounds |
| `--color-surface-muted` | `--gray-50` | Subtle section backgrounds, striped rows |
| `--color-border` | `--gray-200` | Default dividers, card/table borders |
| `--color-border-strong` | `--gray-300` | Input borders, emphasized dividers |
| `--color-text` | `--black-900` | Primary text, headers |
| `--color-text-muted` | `--black-500` | Secondary/helper text |
| `--color-text-disabled` | `--black-300` | Disabled text |
| `--color-primary` | `--red-600` | Primary actions, active states, brand accents |
| `--color-primary-hover` | `--red-700` | Primary hover |
| `--color-primary-active` | `--red-800` | Primary pressed |
| `--color-on-primary` | `--white` | Text/icons on filled red |
| `--color-success` / `-tint` | `--green-600` / `--green-100` | Confirmed, fulfilled, stock increase |
| `--color-warning` / `-tint` | `--amber-700` / `--amber-100` | Low stock, needs attention |
| `--color-info` / `-tint` | `--blue-600` / `--blue-100` | Neutral system notices |
| `--ring-color-action` | `--red-600` | Focus ring on buttons/links/nav |
| `--ring-color-field` | `--black-900` @ 15% | Focus ring on form inputs (see below) |

### Red's Dual Role: Brand Accent vs. Destructive Action

Red is both "this is the brand color" and, conventionally, "this is
dangerous" — those can't be told apart by hue alone. Resolution, applied
consistently everywhere:

- **Primary/brand actions** (Save, Add Product, Confirm) — **solid red
  fill**, white text.
- **Destructive actions** (Delete, Reject Receipt, Cancel Order) — **red
  outline/ghost style** (white background, red border + text), never a
  solid red fill, **plus** a confirmation dialog before it takes effect.

A solid red button always means "do the main thing here"; a red-outlined
button always means "this removes something, think first." No screen should
break this pairing.

## Typography

| Token | Family | Used for |
|---|---|---|
| `--font-display` | **Archivo Black** (weight 900, single cut) | Page titles, dashboard KPI numbers, PDF letterhead — the "chunky logo lettering" register |
| `--font-heading` | **Archivo** (weight 700) | Section/card headers, subheadings — same superfamily as display, quieter |
| `--font-body` | **Inter** (400/500/700) | Body text, form labels, table cells, buttons |
| `--font-mono` | **JetBrains Mono** (500) | SKUs, order/invoice numbers, barcodes — fixed-width so codes align in columns and `0`/`O`, `1`/`l` stay unambiguous |

### Type Scale

| Token | Size | Font | Line height | Use |
|---|---|---|---|---|
| `display-lg` | 32px / 2rem | Archivo Black | 1.15 | Page titles ("Products", "Inventory") |
| `display-md` | 24px / 1.5rem | Archivo Black | 1.2 | Section headers, card titles, dashboard KPIs |
| `heading-sm` | 18px / 1.125rem | Archivo 700 | 1.3 | Subheadings, table group headers |
| `body-lg` | 16px / 1rem | Inter 400 | 1.5 | Primary body text, form inputs |
| `body-sm` | 14px / 0.875rem | Inter 400 | 1.45 | Table cells, helper text |
| `caption` | 12px / 0.75rem | Inter 500, uppercase, +0.02em tracking | 1.3 | Field labels, timestamps, eyebrow tags |
| `mono-sm` | 14px / 0.875rem | JetBrains Mono 500 | 1.4 | SKU, order numbers, barcodes |

Enable tabular figures (`font-variant-numeric: tabular-nums`) on Inter
wherever numbers appear in columns — price, quantity, totals — so digits
align vertically in tables and invoices without extra work.

## Spacing Scale

4px base unit, used for padding, gaps, and margins throughout.

| Token | Value |
|---|---|
| `--space-1` | 4px |
| `--space-2` | 8px |
| `--space-3` | 12px |
| `--space-4` | 16px |
| `--space-6` | 24px |
| `--space-8` | 32px |
| `--space-12` | 48px |
| `--space-16` | 64px |

## Radius & Elevation

| Token | Value | Use |
|---|---|---|
| `--radius-sm` | 2px | Badges, checkboxes, small chips |
| `--radius-default` | 4px | Buttons, inputs, cards |
| `--radius-lg` | 8px | Modals, large panels |

No pill/full radius anywhere — kept crisp and structural to match the
industrial tone, not soft/app-store rounded.

| Token | Value | Use |
|---|---|---|
| `--shadow-sm` | `0 1px 2px rgba(17,17,17,0.06)` | Cards resting on the page |
| `--shadow-md` | `0 4px 12px rgba(17,17,17,0.12)` | Modals, dropdowns, toasts only |

Default buttons and cards use **borders, not shadow**, for hierarchy —
shadow is reserved for things that visually float above the page. This
keeps dense screens (product tables, dashboards) calm instead of busy.

| Token | Value |
|---|---|
| `--duration-fast` | 120ms |
| `--duration-normal` | 180ms |

Kept short deliberately — this is a tool staff use dozens of times a day;
animation should never make them wait.

## Iconography

Simple outline icons, consistent 1.5–2px stroke, no filled/glyph icons
(matches the flat, utilitarian tone). Default color `--black-900`;
`--red-600` only for an active/selected icon or a count badge — icons stay
quiet everywhere else so red keeps its meaning as "pay attention here."
[Lucide](https://lucide.dev) icons are a reasonable concrete pick — open
source, consistent stroke width, wide coverage, easy to install alongside
React.

## Signature Detail: The Bold Rule

The one recurring, memorable device: a **thick 4px solid rule** (black by
default, red when marking the active/selected state) directly under page
titles and the active nav item. It echoes the chunky, confident weight of
the logo's lettering and doubles as a wayfinding cue — you always know
which section/tab is active at a glance, no color legend required. The same
rule appears under the shop name on the PDF invoice letterhead (see
[Invoice/PDF Template](#invoicepdf-template)), tying the printed document
back to the on-screen brand.

## Component States

### Button — Primary

| State | Background | Text | Border |
|---|---|---|---|
| Default | `--color-primary` | `--color-on-primary` | none |
| Hover | `--color-primary-hover` | `--color-on-primary` | none |
| Active | `--color-primary-active` | `--color-on-primary` | none |
| Focus-visible | Default + 2px `--ring-color-action` ring, 2px offset | — | — |
| Disabled | `--gray-200` | `--black-300` | none |

### Button — Secondary (neutral actions, e.g. Cancel)

| State | Background | Text | Border |
|---|---|---|---|
| Default | `--white` | `--black-900` | 1px `--gray-300` |
| Hover | `--gray-50` | `--black-900` | 1px `--gray-300` |
| Active | `--gray-100` | `--black-900` | 1px `--gray-300` |
| Disabled | `--white` | `--black-300` | 1px `--gray-200` |

### Button — Destructive (e.g. Delete Product, Reject Receipt)

Ghost/outline style — see [Red's Dual Role](#reds-dual-role-brand-accent-vs-destructive-action).

| State | Background | Text | Border |
|---|---|---|---|
| Default | `--white` | `--red-600` | 1.5px `--red-600` |
| Hover | `--red-50` | `--red-700` | 1.5px `--red-700` |
| Active | `--red-100` | `--red-800` | 1.5px `--red-800` |
| Disabled | `--white` | `--black-300` | 1.5px `--gray-200` |

Always paired with a confirmation dialog before the action commits (see
[Voice & Microcopy](#voice--microcopy)).

### Input (text field)

| State | Background | Text/Border |
|---|---|---|
| Default | `--white` | `--gray-300` border |
| Focus | `--white` | `--black-900` border + 2px `--ring-color-field` ring |
| Error | `--white` | `--red-600` border, `--red-700` helper text below, error icon |
| Disabled | `--gray-50` | `--black-300` text, `--gray-200` border |

Input focus uses a **neutral black ring**, not red — reserving red
exclusively for the error state so "I'm typing here" and "this field is
wrong" never look the same.

### Badge / Status Pill

Used for order/receipt status and low-stock flags. Always paired with a
text label — never a color-only dot (see [Accessibility](#accessibility)).

| Meaning | Background | Text | Example |
|---|---|---|---|
| Neutral | `--gray-100` | `--black-700` | `Draft`, `Pending Review` |
| Success | `--green-100` | `--green-700` | `Confirmed`, `Fulfilled` |
| Warning | `--amber-100` | `--amber-700` | `Low Stock` |
| Cancelled/Rejected | `--red-100` | `--red-700` | `Cancelled`, `Rejected` |

### Table Row (product lists, movement history)

| State | Background | Notes |
|---|---|---|
| Default | `--white` | 1px `--gray-200` bottom border only — no vertical rules, keeps rows scannable |
| Hover (clickable rows) | `--gray-50` | — |
| Selected | `--red-50` | + 3px `--red-600` left border |
| Low stock | `--white` | Signaled by a `Low Stock` badge in the row, **not** a background tint — full-row tinting for every flagged condition would make dense tables noisy |

Stock movement quantity changes: positive in `--green-600` with a `+`
prefix, negative in `--color-text` (black) with a `−` prefix — an outgoing
movement (a normal sale) isn't an error, so it doesn't get red. Red stays
reserved for actual warnings and destructive actions.

## Voice & Microcopy

Matches the tone already used in [03-ocr-receipt-capture.md](./03-ocr-receipt-capture.md#error-handling):
plain, active voice, states what happened and what to do next, no filler,
no false apology.

- Buttons name the action, not a generic verb: `Add Product`, not `Submit`.
- Confirmation dialogs state the consequence plainly:
  `Delete this product? This can't be undone.` — not
  `Are you sure you want to proceed?`
- Errors say what broke and what to do:
  `OCR service is offline — try again, or enter this receipt manually.`
- Empty states are an invitation, not a dead end:
  `No products match "compresor" — check spelling, or add it as a new part.`

## Applying the System Per Screen

### Product CRUD ([01](./01-product-crud.md))
Forms use standard Input tokens. `sku` renders in `mono-sm` everywhere it's
displayed (list, detail, forms) so codes are easy to scan and copy exactly.
`category` shows as a neutral gray badge (not red — red stays reserved for
actions/alerts, not decoration). `Add Product`/`Save` use the primary
button; `Delete` uses the destructive outline button with a confirm dialog.
A `Low Stock` badge appears next to `stock_quantity` when at/below
`reorder_threshold`.

### Inventory Dashboard ([02](./02-inventory-tracking.md))
KPI numbers (e.g. "Low Stock: 6") use `display-md` in Archivo Black for
instant scanning. The low-stock list uses the warning badge. The movement
history table uses the table-row tokens above, with signed, color-coded
quantity changes as described.

### OCR Review Screen ([03](./03-ocr-receipt-capture.md))
Each parsed line item is a card with a default `--gray-300` border; once a
staff member edits/confirms it, it gets a small success badge/check. The
`Confirm & Commit` primary button stays disabled (disabled button state)
until at least one line item has been reviewed — a UI-level reinforcement
of the "never auto-apply OCR results" rule.

### Invoice/PDF Template ([04](./04-purchase-order-invoice.md))
`--black-900` text on `--white`, `Archivo Black` for the shop name and
document title (`PURCHASE ORDER` / `INVOICE`), the signature bold rule
under the letterhead, `Inter` for line items, `mono-sm` for the order
number and any SKUs in the item table so the columns align cleanly. Totals
row set in `Archivo Black` to stand out. **Default to black & white** —
many shop printers are monochrome; the red rule/accent only renders if the
shop's printer is confirmed color-capable (see [Assumptions](#assumptions--decisions-to-confirm)).

### 3D Navigation Surrounding UI ([07](./07-3d-navigation.md))
The search bar and product info panel (the 2D UI framing the 3D canvas, not
the scene itself) use standard Input/Card tokens on a white surface. The
info panel for the currently-highlighted product gets the same 3px red
left-border treatment as a selected table row, visually tying the panel to
the pin in the scene. Because of this, **category color-coding on cabinets
inside the 3D scene should avoid red** — red is reserved as the single
"you're looking for this one" highlight signal, so it needs to stay
unique against whatever palette the scene's boxes use.

## Accessibility

| Rule | Detail |
|---|---|
| Contrast | `--red-600` on white ≈ 5.1:1 (passes AA normal text/UI). `--black-900` on white ≈ 18.9:1. All text/background pairs above meet 4.5:1 (normal text) / 3:1 (large text, UI components). |
| Color is never the only signal | Status badges always carry a text label; low stock is a labeled badge, not just a colored dot; positive/negative stock changes use `+`/`−` prefixes in addition to color. |
| Focus always visible | `focus-visible` rings are never suppressed; distinct ring colors for actions (red) vs. fields (black) as described above. |
| Touch targets | Minimum 40px height on buttons and tappable rows — this runs on shop-floor tablets/touchscreens where staff may be moving quickly or wearing gloves, not just a desktop mouse. |
| Reduced motion | Respect `prefers-reduced-motion`; the 3D camera fly-to in [07](./07-3d-navigation.md#flow) should snap instead of animate when set. |

## Assumptions / Decisions to Confirm

- **Light theme only — no dark mode.** The brief specifies white as the
  core background; a shop-floor tool viewed under normal indoor lighting
  doesn't clearly need one, and skipping it avoids a second token layer to
  maintain. Revisit if staff actually ask for it.
- **Fonts must be self-hosted, not loaded from Google Fonts' CDN.** This
  system runs on a local network without guaranteed internet access (see
  [00-overview.md](./00-overview.md)), so Archivo, Archivo Black, Inter,
  and JetBrains Mono need to ship as bundled font files in the frontend
  build, not fetched at runtime.
- **PDF invoices assume black & white printing by default**; the brand red
  is treated as an on-screen accent first. Confirm whether the shop's
  printer is color-capable before relying on red in the printed document.
- **Icon library (Lucide) is a suggestion, not a hard requirement** — any
  icon set with consistent outline stroke width works; the important rule
  is consistency, not the specific library.
