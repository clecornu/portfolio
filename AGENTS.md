# Prima Persona

Prima Persona is a one-page personal portfolio theme built with Astro and Tailwind CSS.

**Publisher:** [Lexington Themes](https://lexingtonthemes.com)  
**Design rules:** [.cursor/skills/primapersona-design/SKILL.md](./.cursor/skills/primapersona-design/SKILL.md) - read before creating or changing any UI.  

## Structure

- `src/pages/index.astro` - the landing page, composed of `src/components/landing/` sections.
- `src/components/fundations/` - design primitives: `elements/Text.astro`, `elements/Button.astro`, `containers/Wrapper.astro`, `icons/`, `head/`.
- `src/styles/global.css` - Tailwind v4 `@theme` tokens (the `accent` and `base` color scales, Inter font).
- `src/pages/system/` - component showcase pages (typography, colors, buttons, links).

## Conventions

- No build scripts beyond standard Astro (`npm run dev`, `npm run build`).
- Do not add dependencies without asking.
