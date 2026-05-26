# UI Standard — Tailwind CSS + Vue 3
> **AI INSTRUCTION**: When this file is consumed, generate all UI code using **Vue 3 Composition API (`<script setup>`)** with **Tailwind CSS utility classes only**. No inline styles. No custom CSS unless explicitly noted. Follow every rule in this document precisely.

---

## 1. Stack Contract

| Layer | Technology | Notes |
|---|---|---|
| Framework | Vue 3 | Always use `<script setup>` + Composition API |
| Styling | Tailwind CSS v3 | Utility-first, no inline styles |
| Icons | Heroicons (outline) | Via `@heroicons/vue` |
| State | `ref`, `reactive`, `computed` | No Vuex/Pinia unless scoped state is required |
| Animation | Tailwind `transition-*` + `duration-*` | CSS-only transitions |

---

## 2. Color Tokens

> **AI INSTRUCTION**: Map every color token below to Tailwind's `text-`, `bg-`, `border-`, `ring-` utilities via `tailwind.config.js` extension. Use token names as Tailwind class suffixes (e.g. `bg-primary`, `text-on-primary`).
>
> **Design Intent**: This palette targets professional PoS / PC Hardware interfaces. The aesthetic is authoritative, utilitarian, and slightly old-school — inspired by IBM SurePOS, NCR terminal chrome, and classic enterprise retail software. Deep navy commands authority; warm amber signals action like a receipt printer ready light; parchment surfaces evoke the warmth of paper ledgers and receipt rolls. Avoid pure whites and cold grays — everything leans warm.

### 2.1 Primitive Palette (Raw hex values — source of truth)

```
/* ── Warm Neutrals (parchment scale) ── */
--color-parchment-50:   #FDFBF7   /* near-white warm */
--color-parchment-100:  #F7F2E8   /* light parchment */
--color-parchment-200:  #EDE5D4   /* mid parchment */
--color-parchment-300:  #D9CEBC   /* warm tan */
--color-parchment-400:  #BDB0998  /* warm sand */
--color-parchment-500:  #A09080   /* warm taupe */

/* ── Warm Grays (terminal chrome) ── */
--color-chrome-50:      #F2EFE9   /* off-white chrome */
--color-chrome-100:     #E3DDD4   /* light chrome */
--color-chrome-200:     #C8BFB2   /* mid chrome */
--color-chrome-300:     #A89D8E   /* warm mid-gray */
--color-chrome-400:     #857870   /* deep warm gray */
--color-chrome-500:     #5E534A   /* charcoal warm */
--color-chrome-600:     #3D332C   /* near-dark warm */
--color-chrome-700:     #241E19   /* deep charcoal */
--color-chrome-800:     #161210   /* near-black warm */

/* ── Navy (brand / primary) ── */
--color-navy-50:        #EAF0FA   /* lightest navy tint */
--color-navy-100:       #C8D9F2   /* light navy tint */
--color-navy-200:       #91B0E3   /* soft navy */
--color-navy-400:       #3A6BBF   /* mid navy */
--color-navy-600:       #1B3F80   /* navy — primary */
--color-navy-700:       #142F63   /* navy hover */
--color-navy-800:       #0D2049   /* deep navy */
--color-navy-900:       #071330   /* darkest navy */

/* ── Amber (action / accent) ── */
--color-amber-50:       #FEF8EC   /* lightest amber tint */
--color-amber-100:      #FDECC8   /* warm amber tint */
--color-amber-200:      #FAD48A   /* light amber */
--color-amber-400:      #E8960E   /* mid amber */
--color-amber-500:      #C97D08   /* amber — accent */
--color-amber-600:      #A86405   /* amber hover */
--color-amber-700:      #7D4904   /* deep amber */
--color-amber-800:      #532F02   /* darkest amber */

/* ── Forest Green (success) ── */
--color-forest-50:      #EBF5EB   /* lightest green tint */
--color-forest-500:     #2E6B2E   /* success green */
--color-forest-600:     #215221   /* success hover */
--color-forest-700:     #163816   /* deep success */

/* ── Crimson (danger) ── */
--color-crimson-50:     #FAEAEA   /* lightest danger tint */
--color-crimson-500:    #8B2020   /* danger red */
--color-crimson-600:    #6E1717   /* danger hover */
--color-crimson-700:    #4F0F0F   /* deep danger */

/* ── Mustard (warning) ── */
--color-mustard-50:     #FBF6E4   /* lightest warning tint */
--color-mustard-500:    #9A7300   /* warning mustard */
--color-mustard-600:    #7A5C00   /* warning hover */

/* ── Terminal Dark (panel / header chrome) ── */
--color-terminal-900:   #111820   /* darkest panel bg — like old POS chrome */
--color-terminal-800:   #1A2433   /* deep panel bg */
--color-terminal-700:   #243040   /* panel bg */
--color-terminal-600:   #334456   /* panel border */
```

### 2.2 Semantic Tokens (Use these in components — never raw primitives)

```
/* ─────────────────────────────────────
   BRAND / PRIMARY  (Deep Navy)
   Use for: primary buttons, links, active nav, focus rings
───────────────────────────────────── */
--color-primary:          #1B3F80   /* navy-600  — main CTA, active state */
--color-primary-hover:    #142F63   /* navy-700  — hover */
--color-primary-active:   #0D2049   /* navy-800  — pressed */
--color-primary-subtle:   #C8D9F2   /* navy-100  — tinted bg (chips, highlights) */
--color-on-primary:       #FDFBF7   /* parchment-50 — text/icon on primary bg */

/* ─────────────────────────────────────
   ACCENT  (Warm Amber)
   Use for: secondary CTAs, badges, receipt totals, "ready" indicators
───────────────────────────────────── */
--color-accent:           #C97D08   /* amber-500 — accent action */
--color-accent-hover:     #A86405   /* amber-600 — hover */
--color-accent-subtle:    #FDECC8   /* amber-100 — tinted bg */
--color-on-accent:        #161210   /* chrome-800 — text on amber bg */

/* ─────────────────────────────────────
   SURFACES  (Warm Parchment)
   Use for: page bg, card bg, input bg
───────────────────────────────────── */
--color-surface:          #F7F2E8   /* parchment-100 — main page/card bg */
--color-surface-raised:   #FDFBF7   /* parchment-50  — elevated cards, modals */
--color-surface-sunken:   #EDE5D4   /* parchment-200 — inset, input bg, table rows */
--color-surface-panel:    #1A2433   /* terminal-800  — dark header / nav chrome */
--color-surface-panel-fg: #C8D9F2   /* navy-100      — text on dark panel */

/* ─────────────────────────────────────
   BORDERS
───────────────────────────────────── */
--color-border:           #D9CEBC   /* parchment-300 — default borders */
--color-border-strong:    #A89D8E   /* chrome-300    — focus / emphasis borders */
--color-border-panel:     #334456   /* terminal-600  — borders inside dark panels */

/* ─────────────────────────────────────
   TEXT
───────────────────────────────────── */
--color-text-primary:     #161210   /* chrome-800    — headings, body */
--color-text-secondary:   #5E534A   /* chrome-500    — labels, captions */
--color-text-muted:       #A89D8E   /* chrome-300    — placeholder, disabled */
--color-text-inverse:     #F7F2E8   /* parchment-100 — on dark bg */
--color-text-link:        #1B3F80   /* navy-600      — hyperlinks */
--color-text-accent:      #A86405   /* amber-600     — highlighted values */

/* ─────────────────────────────────────
   FEEDBACK
───────────────────────────────────── */
--color-success:          #2E6B2E   /* forest-500   */
--color-success-subtle:   #EBF5EB   /* forest-50    */
--color-on-success:       #FDFBF7   /* parchment-50 */

--color-warning:          #9A7300   /* mustard-500  */
--color-warning-subtle:   #FBF6E4   /* mustard-50   */
--color-on-warning:       #161210   /* chrome-800   */

--color-danger:           #8B2020   /* crimson-500  */
--color-danger-subtle:    #FAEAEA   /* crimson-50   */
--color-on-danger:        #FDFBF7   /* parchment-50 */

--color-info:             #1B3F80   /* navy-600     */
--color-info-subtle:      #EAF0FA   /* navy-50      */
--color-on-info:          #FDFBF7   /* parchment-50 */
```

### 2.3 `tailwind.config.js` Token Extension

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        /* Brand */
        primary: {
          DEFAULT: '#1B3F80',
          hover:   '#142F63',
          active:  '#0D2049',
          subtle:  '#C8D9F2',
        },
        'on-primary': '#FDFBF7',

        /* Accent */
        accent: {
          DEFAULT: '#C97D08',
          hover:   '#A86405',
          subtle:  '#FDECC8',
        },
        'on-accent': '#161210',

        /* Surfaces */
        surface: {
          DEFAULT: '#F7F2E8',
          raised:  '#FDFBF7',
          sunken:  '#EDE5D4',
          panel:   '#1A2433',
        },
        'surface-panel-fg': '#C8D9F2',

        /* Borders */
        border: {
          DEFAULT: '#D9CEBC',
          strong:  '#A89D8E',
          panel:   '#334456',
        },

        /* Text */
        text: {
          primary:   '#161210',
          secondary: '#5E534A',
          muted:     '#A89D8E',
          inverse:   '#F7F2E8',
          link:      '#1B3F80',
          accent:    '#A86405',
        },

        /* Feedback */
        success: { DEFAULT: '#2E6B2E', subtle: '#EBF5EB', on: '#FDFBF7' },
        warning: { DEFAULT: '#9A7300', subtle: '#FBF6E4', on: '#161210' },
        danger:  { DEFAULT: '#8B2020', subtle: '#FAEAEA', on: '#FDFBF7' },
        info:    { DEFAULT: '#1B3F80', subtle: '#EAF0FA', on: '#FDFBF7' },
      },
    },
  },
}
```

---

## 3. Typography

> **AI INSTRUCTION**: Never use `font-sans` alone. Always pair display + body fonts. Use scale classes below strictly.

| Token | Tailwind Classes | Usage |
|---|---|---|
| `display-xl` | `text-5xl font-bold tracking-tight leading-none` | Hero headings |
| `display-lg` | `text-4xl font-bold tracking-tight leading-tight` | Page titles |
| `heading-md` | `text-2xl font-semibold leading-snug` | Section headers |
| `heading-sm` | `text-lg font-semibold leading-snug` | Card titles |
| `body-lg` | `text-base font-normal leading-relaxed` | Main body copy |
| `body-sm` | `text-sm font-normal leading-relaxed` | Secondary content |
| `label` | `text-sm font-medium leading-none` | Form labels, badges |
| `caption` | `text-xs font-normal leading-normal text-text-secondary` | Helper text, timestamps |
| `code` | `text-sm font-mono` | Inline code snippets |

Font pairing (import via `@fontsource` or Google Fonts):
```
Display / Headings : "Plus Jakarta Sans", sans-serif
Body               : "Inter", sans-serif
Mono               : "JetBrains Mono", monospace
```

---

## 4. Spacing & Layout

> **AI INSTRUCTION**: Use Tailwind's default 4px-base spacing scale. Avoid arbitrary values (`[value]`) unless fractional px is genuinely required.

### 4.1 Spacing Scale (Common)

| Token | px | Tailwind |
|---|---|---|
| `space-1` | 4px | `p-1`, `m-1`, `gap-1` |
| `space-2` | 8px | `p-2`, `m-2`, `gap-2` |
| `space-3` | 12px | `p-3`, `m-3`, `gap-3` |
| `space-4` | 16px | `p-4`, `m-4`, `gap-4` |
| `space-6` | 24px | `p-6`, `m-6`, `gap-6` |
| `space-8` | 32px | `p-8`, `m-8`, `gap-8` |
| `space-12` | 48px | `p-12`, `m-12`, `gap-12` |
| `space-16` | 64px | `p-16`, `m-16`, `gap-16` |

### 4.2 Layout Grid

```
Page max-width  : max-w-7xl mx-auto
Page padding    : px-4 sm:px-6 lg:px-8
Section gap     : space-y-12 or space-y-16
Card gap        : gap-4 sm:gap-6
```

### 4.3 Border Radius

| Token | Tailwind | Usage |
|---|---|---|
| `radius-sm` | `rounded` | Badges, tags |
| `radius-md` | `rounded-lg` | Cards, inputs, buttons |
| `radius-lg` | `rounded-2xl` | Modals, panels |
| `radius-full` | `rounded-full` | Avatars, pills, toggles |

---

## 5. Component Patterns

> **AI INSTRUCTION**: These are the exact Tailwind class sets to use. Do not invent alternative patterns.

### 5.1 Button

```vue
<!-- Primary -->
<button class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-on-primary text-sm font-medium
               transition-colors duration-150 hover:bg-primary-hover
               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
               disabled:opacity-50 disabled:cursor-not-allowed">
  Label
</button>

<!-- Secondary -->
<button class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-surface border border-border text-text-primary text-sm font-medium
               transition-colors duration-150 hover:bg-surface-sunken
               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-strong focus-visible:ring-offset-2
               disabled:opacity-50 disabled:cursor-not-allowed">
  Label
</button>

<!-- Danger -->
<button class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-danger text-white text-sm font-medium
               transition-colors duration-150 hover:bg-red-700
               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger focus-visible:ring-offset-2
               disabled:opacity-50 disabled:cursor-not-allowed">
  Label
</button>

<!-- Ghost -->
<button class="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-text-secondary text-sm font-medium
               transition-colors duration-150 hover:bg-surface-sunken hover:text-text-primary
               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-strong focus-visible:ring-offset-2">
  Label
</button>
```

**Sizes:**
```
sm : px-3 py-1.5 text-xs rounded
md : px-4 py-2   text-sm rounded-lg   ← default
lg : px-5 py-2.5 text-base rounded-lg
```

---

### 5.2 Input / Form Field

```vue
<div class="flex flex-col gap-1.5">
  <label class="text-sm font-medium text-text-primary">Label</label>
  <input
    type="text"
    placeholder="Placeholder"
    class="w-full px-3 py-2 rounded-lg bg-surface-sunken border border-border text-text-primary text-sm
           placeholder:text-text-disabled
           transition-colors duration-150
           hover:border-border-strong
           focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
           disabled:opacity-50 disabled:cursor-not-allowed"
  />
  <!-- Helper / Error text -->
  <p class="text-xs text-text-secondary">Helper text</p>
  <p class="text-xs text-danger">Error message</p>
</div>
```

**Error state override**: add `border-danger focus:ring-danger` on the input.

---

### 5.3 Card

```vue
<!-- Default Card -->
<div class="rounded-2xl bg-surface-raised border border-border p-6 shadow-sm">
  <!-- content -->
</div>

<!-- Interactive Card (clickable) -->
<div class="rounded-2xl bg-surface-raised border border-border p-6 shadow-sm
            transition-shadow duration-150 hover:shadow-md cursor-pointer">
  <!-- content -->
</div>

<!-- Highlighted Card -->
<div class="rounded-2xl bg-primary-subtle border border-primary p-6">
  <!-- content -->
</div>
```

---

### 5.4 Badge / Tag

```vue
<!-- Neutral -->
<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-surface-sunken text-text-secondary border border-border">
  Label
</span>

<!-- Success -->
<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-subtle text-success">
  Success
</span>

<!-- Warning -->
<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-warning-subtle text-warning">
  Warning
</span>

<!-- Danger -->
<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-danger-subtle text-danger">
  Error
</span>

<!-- Info / Primary -->
<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-info-subtle text-info">
  Info
</span>
```

---

### 5.5 Alert / Banner

```vue
<div class="flex items-start gap-3 rounded-lg border p-4
            [variant: success] bg-success-subtle border-success text-success
            [variant: warning] bg-warning-subtle border-warning text-warning
            [variant: danger]  bg-danger-subtle  border-danger  text-danger
            [variant: info]    bg-info-subtle    border-info    text-info">
  <!-- Icon slot -->
  <div class="flex flex-col gap-0.5">
    <p class="text-sm font-semibold">Title</p>
    <p class="text-sm">Description message here.</p>
  </div>
</div>
```

---

### 5.6 Modal / Dialog

```vue
<!-- Overlay -->
<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
  <!-- Panel -->
  <div class="w-full max-w-md rounded-2xl bg-surface-raised border border-border shadow-xl p-6 mx-4">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-semibold text-text-primary">Modal Title</h2>
      <button class="text-text-secondary hover:text-text-primary transition-colors duration-150">✕</button>
    </div>
    <div class="text-sm text-text-secondary leading-relaxed">
      <!-- Body content -->
    </div>
    <div class="flex justify-end gap-3 mt-6">
      <!-- Action buttons -->
    </div>
  </div>
</div>
```

---

### 5.7 Table

```vue
<div class="w-full overflow-x-auto rounded-xl border border-border">
  <table class="w-full text-sm text-left text-text-primary">
    <thead class="bg-surface-sunken text-text-secondary text-xs font-medium uppercase tracking-wide">
      <tr>
        <th class="px-4 py-3 border-b border-border">Column</th>
      </tr>
    </thead>
    <tbody class="divide-y divide-border">
      <tr class="hover:bg-surface-sunken transition-colors duration-100">
        <td class="px-4 py-3">Cell</td>
      </tr>
    </tbody>
  </table>
</div>
```

---

### 5.8 Avatar

```vue
<!-- Image avatar -->
<img class="w-8 h-8 rounded-full object-cover ring-2 ring-border" src="..." alt="Name" />

<!-- Fallback initials -->
<span class="inline-flex w-8 h-8 rounded-full bg-primary-subtle text-primary text-xs font-semibold items-center justify-center">
  AB
</span>

<!-- Sizes: w-6 h-6 (xs) | w-8 h-8 (sm) | w-10 h-10 (md) | w-12 h-12 (lg) | w-16 h-16 (xl) -->
```

---

### 5.9 Divider

```vue
<hr class="border-t border-border my-4" />

<!-- With label -->
<div class="flex items-center gap-3 my-4">
  <hr class="flex-1 border-t border-border" />
  <span class="text-xs text-text-secondary">OR</span>
  <hr class="flex-1 border-t border-border" />
</div>
```

---

### 5.10 Skeleton Loader

```vue
<div class="animate-pulse flex flex-col gap-3">
  <div class="h-4 bg-grey-100 rounded w-3/4"></div>
  <div class="h-4 bg-grey-100 rounded w-1/2"></div>
  <div class="h-10 bg-grey-100 rounded-lg"></div>
</div>
```

---

## 6. Shadow Scale

| Token | Tailwind | Usage |
|---|---|---|
| `shadow-none` | `shadow-none` | Flat surfaces |
| `shadow-sm` | `shadow-sm` | Cards, default elevation |
| `shadow-md` | `shadow-md` | Dropdowns, tooltips |
| `shadow-lg` | `shadow-lg` | Modals, floating panels |
| `shadow-xl` | `shadow-xl` | Full-screen overlays |

---

## 7. Transition Defaults

> **AI INSTRUCTION**: Always include transition utilities on interactive elements. Use these exact class sets.

```
Hover color change   : transition-colors duration-150 ease-in-out
Hover shadow change  : transition-shadow duration-150 ease-in-out
Hover transform      : transition-transform duration-150 ease-in-out
Expand / collapse    : transition-all duration-200 ease-in-out
Opacity fade         : transition-opacity duration-200 ease-in-out
```

---

## 8. Vue 3 Component Template Structure

> **AI INSTRUCTION**: Every generated `.vue` file MUST follow this exact structure.

```vue
<script setup lang="ts">
// 1. Vue core imports
import { ref, computed } from 'vue'

// 2. Third-party imports
// import { SomeIcon } from '@heroicons/vue/24/outline'

// 3. Props (use defineProps with TypeScript types)
const props = defineProps<{
  label: string
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  disabled?: boolean
}>()

// 4. Emits
const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

// 5. Reactive state
const isOpen = ref(false)

// 6. Computed
const classes = computed(() => {
  // Return dynamic class string
})

// 7. Methods / handlers (arrow functions)
const handleClick = (e: MouseEvent) => {
  emit('click', e)
}
</script>

<template>
  <!-- Single root element -->
  <div>
    <!-- Content -->
  </div>
</template>
```

**Rules:**
- Always `lang="ts"` on `<script setup>`
- Always define props with TypeScript generics
- Single root element in `<template>`
- No `<style>` block unless scoped CSS is unavoidable (never for colors/spacing)
- Use `:class` binding for dynamic/conditional Tailwind classes (not `v-bind:style`)

---

## 9. Responsive Breakpoints

> Follow Tailwind's default breakpoint prefixes. Always mobile-first.

| Prefix | Min-width | Usage |
|---|---|---|
| _(none)_ | 0px | Mobile base |
| `sm:` | 640px | Large mobile / small tablet |
| `md:` | 768px | Tablet |
| `lg:` | 1024px | Desktop |
| `xl:` | 1280px | Wide desktop |
| `2xl:` | 1536px | Ultra-wide |

Pattern:
```html
<div class="flex flex-col gap-4 sm:flex-row sm:gap-6 lg:gap-8">
```

---

## 10. Accessibility Rules

> **AI INSTRUCTION**: These are non-negotiable and must be applied to every component.

1. Every interactive element needs `focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2`
2. Images must have `alt` attributes (descriptive or `alt=""` if decorative)
3. Icon-only buttons must have `aria-label`
4. Form inputs must have associated `<label>` (via `for`/`id` or wrapping)
5. Disabled elements must have `disabled:opacity-50 disabled:cursor-not-allowed`
6. Color is never the sole indicator of state — always pair with icon or text
7. Modals/dialogs must trap focus and respond to `Escape` key

---

## 11. Do / Don't Quick Reference

| ✅ DO | ❌ DON'T |
|---|---|
| Use semantic token names (`bg-primary`) | Use raw hex in Tailwind classes (`bg-[#2563EB]`) |
| Use `<script setup lang="ts">` | Use Options API or `<script>` without setup |
| Use `:class` for conditional classes | Use inline `:style` for colors or spacing |
| Compose components from smaller pieces | Build monolithic 200-line templates |
| Mobile-first responsive classes | Desktop-only classes without responsive variants |
| `transition-colors duration-150` on all interactive elements | Static/no-transition hover states |
| `focus-visible:ring-*` for focus styles | Remove or ignore focus outlines |
| Token spacing (`p-4`, `gap-6`) | Arbitrary values (`p-[14px]`) unless strictly necessary |

---

*End of UI Standard — Tailwind CSS + Vue 3*
