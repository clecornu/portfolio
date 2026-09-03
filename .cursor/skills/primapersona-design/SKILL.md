---
name: primapersona-design
description: Prima Persona's design system - typography, color, spacing, and component rules. Use whenever creating or modifying UI in this theme (new pages, sections, components) so the result matches Prima Persona's visual language.
---

# Prima Persona design system

Prima Persona is a one-page personal portfolio theme (creative technologist /
designer persona) with a Swiss-editorial feel: a strict 4-column grid,
monochrome color, small utilitarian labels, hairline rules between entries,
and true light/dark mode. When you build new UI here, it should be
indistinguishable from the existing sections.

## Design personality

- Editorial and restrained: the page is essentially a typographic index -
  rows of year / title / description / category separated by hairline rules.
- Monochrome by default: the landing page uses only the neutral `base` scale;
  the green `accent` scale appears only on hover and in Button variants.
- Hierarchy through position and weight, not size: section `h2`s (`textXL`)
  are *smaller* than the row titles under them (`displaySM`).
- Dark mode is a first-class citizen - every color utility ships with a
  `dark:` twin.

## Typography

Font is **Inter** only (`--font-sans: "Inter"` in `src/styles/global.css`,
loaded from rsms.me via `fundations/head/Fonts.astro`). No serif, no mono,
no extra OpenType feature settings. Never introduce another font.

Always use the `Text` component
(`@/components/fundations/elements/Text.astro`) instead of raw tags with
ad-hoc sizes. Variants: `display6XL`-`displayXS` and `textXL`-`textXS`.
The theme deliberately uses the *low* end of that scale:

- Hero title: `tag="h1" variant="displayLG"` +
  `font-semibold leading-snug tracking-tighter`, colored
  `text-base-900 dark:text-white`, placed with `lg:col-span-2 lg:col-start-3`
  (the grid, not `max-w-*`, controls line length).
- Section heading: `tag="h2" variant="textXL"` +
  `font-semibold leading-snug tracking-tighter lg:col-span-2`.
- Row title: `tag="h3" variant="displaySM"` (Work/Projects) or `textLG`
  (Education/Speaking) + `font-semibold leading-tight`.
- Body / descriptions: `variant="textSM"` in
  `text-base-600 dark:text-base-300`.
- Meta labels (years, categories): `variant="textXS"` + `uppercase`.
- Nav and footer links are raw anchors at `text-xs tracking-tight`.

Headings are `font-semibold` with `tracking-tighter`; small text uses
`tracking-tight`. No `font-bold`, no `text-balance`, no `max-w-*` clamps on
headings - the 4-column grid does the measuring.

## Color system

Only two scales exist in `@theme` (`src/styles/global.css`): the vivid green
oklch **`accent`** scale (hue ~135) and the pure-gray **`base`** scale
(chroma 0), each 50-950. Use nothing else - no default Tailwind palettes,
no hex values in markup.

Usage rules:

- Page background: `bg-white dark:bg-base-950` (set on `<body>` in
  `BaseLayout.astro`; don't repeat it per section).
- Headings and emphasized text: `text-base-900 dark:text-white`.
- Body and meta text: `text-base-600 dark:text-base-300`.
- Hairline rules: `border-base-200 dark:border-base-800`.
- `accent` is reserved: on the landing page it appears only as a hover state
  (`hover:text-accent-600`) and in the Button `accent` variant. Never use it
  for large surfaces, headings, or backgrounds of sections.
- No tinted panels, no gradients, no colored section backgrounds - sections
  sit directly on the page background.

**Dark mode is real** and driven by `prefers-color-scheme` (no
`@custom-variant`, no class toggle). Every color utility you write must have
a `dark:` counterpart following the pairs above.

## Layout and spacing

- Every section is `<section class="scroll-mt-32" id="...">` (the ids feed
  the fixed nav's anchor links) wrapping a `Wrapper`
  (`@/components/fundations/containers/Wrapper.astro`). Only one variant is
  implemented: `standard` = `max-w-screen 2xl:max-w-[90rem] mx-auto px-8`.
  Don't hand-roll `max-w-* mx-auto` containers.
- Section vertical padding goes on the Wrapper: `py-12 lg:py-24`. The hero
  uses `pb-8 pt-40 lg:pt-80` because the nav is fixed; nav and footer use
  `py-2`.
- **Everything sits on the same 4-column grid**:
  `grid grid-cols-1 lg:grid-cols-4 items-start`. Signature placements:
  - Hero h1: `lg:col-span-2 lg:col-start-3` (right half).
  - Section header: eyebrow label (`textSM`, two lines via `<br />`) at
    `lg:col-start-2`, then the h2 spanning `lg:col-span-2`.
  - List row: col 1 year (`textXS` uppercase), col 2 title, col 3
    description (`textSM`), col 4 category (`textXS` uppercase
    `lg:ml-auto lg:col-start-4`) - with `gap-4` between columns.
- Lists are `flex flex-col gap-12 mt-8` (or `mt-12`); each entry is an
  `<article class="py-12 border-t border-base-200 dark:border-base-800">`.
  The top border is the only separator - no cards, no backgrounds.
- Images (astro:assets `Image`) run full column width:
  `size-full aspect-4/2 rounded-4xl mt-12 object-cover object-center`, with
  explicit `width`/`height` and `loading="lazy" decoding="async"`.

## Components

Reuse these before writing anything new:

- **Text** (`fundations/elements/Text.astro`): the only sanctioned type
  scale (see Typography). Accepts any tag plus a `variant`.
- **Button** (`fundations/elements/Button.astro`): variants `default`
  (base-800, white text), `accent` (accent-500), `muted` (base-100), `none`;
  sizes `xxs`-`xl` (fixed heights `h-7.5`-`h-13`); `isLink` + `href` renders
  an anchor; `iconOnly` renders square `size-*` icon buttons; `gap`
  (`xs`-`lg`) spaces slotted icons. Buttons are **pills** - `rounded-full`
  is baked in; never add other radius classes. The component is block-level
  `flex` and stretches to its container, so standalone buttons need `w-fit`
  or a flex parent. **Note:** the landing page itself uses no Buttons at
  all - real CTAs are plain `text-xs tracking-tight` anchors or an sr-only
  link wrapping an `ArrowRight` icon (see `Speaking.astro`). Match that
  restraint; Buttons live mainly in the `/system` showcase pages.
- **Wrapper**: the only page-width container (see Layout).
- **Logo** (`assets/Logo.astro`): a plain text span (`alessandro.p`), styled
  by the caller at `text-xs tracking-tight`.
- Icons live in `fundations/icons/` as individual Astro components (only
  `ArrowRight` and `Plus` exist); add new ones there in the same stroke
  style rather than importing icon packs. Icon links pair a
  `<span class="sr-only">` label with a `size-4` icon.

## Corners, borders, shadows

- Radius is binary: **`rounded-4xl` on large images** (2 uses) and the
  Button's built-in `rounded-full` - nothing in between (one `rounded-md`
  exists only in a `/system` color swatch). Never round cards, sections, or
  text blocks; there are no cards.
- Borders are 1px `border-t` hairlines in `base-200`/`dark:base-800`, used
  as row separators - not boxes or rings around content.
- **Zero shadows** - the codebase contains no `shadow-*` classes at all.

## Voice and copy

Copy is terse, declarative, and systems-minded: fragments over sentences
("Code. Design. Strategy. Digital products with intent."), constraint
vocabulary ("trade-offs", "failure modes", "under real-world pressure").
Section eyebrow labels are short two-liners ("Featured Work / 2026 - Now").
Meta labels are Title Case in source and uppercased by CSS. No exclamation
marks, no emoji, no marketing superlatives.

## Do / Don't

Do:

- Copy an existing section's structure (`Work.astro` for image rows,
  `Education.astro` for text-only rows) before inventing a new layout.
- Keep every new block on the `lg:grid-cols-4` grid and pick placements from
  the signature set above.
- Pair every color utility with its `dark:` twin.
- Add `scroll-mt-32` and an `id` to new sections so anchor nav keeps working.

Don't:

- Don't add cards, panels, tinted backgrounds, gradients, or shadows.
- Don't use `accent` for anything but hover states or an explicit Button.
- Don't round anything except large images (`rounded-4xl`) - buttons handle
  their own `rounded-full`.
- Don't use default Tailwind `gray`/`slate`/`zinc` classes - the neutral
  scale here is `base-*`.
- Don't reach for big display variants; this theme's section headings are
  `textXL` and the hero is only `displayLG`.
- Don't inline a heading with raw classes when `Text` has a variant for it.

## Quality check before finishing

1. Fonts, colors, and spacing all come from existing tokens and match a
   sibling section.
2. Layout holds on the 4-column grid and collapses to one column below `lg`.
3. Every color class has a `dark:` counterpart; check both schemes.
4. Headings use `Text` variants; any buttons use `Button` variants.
5. No new dependencies, no unused imports, minimal diff.
