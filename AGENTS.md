# Prima Persona

Prima Persona is a one-page personal portfolio theme built with Astro and Tailwind CSS.

**Publisher:** [Lexington Themes](https://lexingtonthemes.com)  
**Design rules:** [.cursor/skills/primapersona-design/SKILL.md](./.cursor/skills/primapersona-design/SKILL.md) - read before creating or changing any UI.  

## Structure

- `src/pages/index.astro` - the landing page, composed of `src/components/landing/` sections. `src/pages/404.astro` uses `src/components/notfound/NotFound.astro`.
- `src/components/fundations/` - design primitives: `elements/Text.astro`, `elements/Button.astro`, `containers/Wrapper.astro`, `icons/`, `head/`.
- `src/styles/global.css` - Tailwind v4 `@theme` tokens (four semantic colours, `background`, `foreground`, `muted` and `muted-foreground`, with dark values for `prefers-color-scheme`; Inter font).
- `src/pages/system/` - showcase pages (overview, colors, typography, buttons, links), composed of `src/components/system/` sections.

## Conventions

- No build scripts beyond standard Astro (`npm run dev`, `npm run build`).
- Keep dependencies lean: add one only when the theme needs it. Lenis (smooth scroll, wired in `BaseLayout`) is part of every theme.
