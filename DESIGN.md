---
name: "Trakko"
description: "A daylight studio for independent music: sky canvas, paper cards, charcoal pills, and medium-weight Inter."
colors:
  bg: "#ebf5ff"
  surface: "#fafdff"
  surface-2: "#f6f7f8"
  white: "#ffffff"
  text: "#0a0d12"
  ink: "#181d27"
  muted: "#535862"
  accent: "#0069e0"
  line: "#dce6ef"
  sidebar: "#e1effc"
  lavender: "#f1e6ff"
  peach: "#ffecdf"
  powder-blue: "#cce7ff"
  setup: "#e5eaff"
  task-hover: "#303743"
  price-surface: "#edf4fb"
  price-hover: "#e1eefd"
  error: "#a52a38"
  error-bg: "#fff1f2"
  error-line: "#efc9cf"
typography:
  display:
    fontFamily: "Inter, sans-serif"
    fontSize: "clamp(72px, 10.3vw, 148px)"
    fontWeight: 500
    lineHeight: 1.05
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Inter, sans-serif"
    fontSize: "clamp(42px, 5vw, 64px)"
    fontWeight: 500
    lineHeight: 1.12
    letterSpacing: "-0.02em"
  page-title:
    fontFamily: "Inter, sans-serif"
    fontSize: "40px"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Inter, sans-serif"
    fontSize: "14px"
    fontWeight: 500
    lineHeight: 1.5
    letterSpacing: "-0.01em"
    fontFeature: "\"case\""
  intro:
    fontFamily: "Inter, sans-serif"
    fontSize: "17px"
    fontWeight: 500
    lineHeight: 1.65
    letterSpacing: "-0.01em"
  label:
    fontFamily: "Inter, sans-serif"
    fontSize: "13px"
    fontWeight: 600
    lineHeight: 1.5
  button:
    fontFamily: "Inter, sans-serif"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: 1.5
  marketing-button:
    fontFamily: "Inter, sans-serif"
    fontSize: "16px"
    fontWeight: 500
    lineHeight: 1.5
rounded:
  field: "16px"
  artwork: "24px"
  card: "32px"
  pill: "9999px"
  navigation-item: "9px"
  circle: "50%"
spacing:
  control-gap: "9px"
  action-gap: "14px"
  mobile-gutter: "20px"
  desktop-gutter: "32px"
  element-gap: "24px"
  card-padding: "40px"
  section: "80px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.white}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    padding: "12px 24px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.task-hover}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    padding: "12px 24px"
    height: "44px"
  button-marketing:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.white}"
    typography: "{typography.marketing-button}"
    rounded: "{rounded.pill}"
    padding: "14px 32px"
    height: "52px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.field}"
    padding: "12px 14px"
    height: "44px"
  navigation-active:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.white}"
    rounded: "{rounded.navigation-item}"
    padding: "11px 12px"
    height: "43px"
  status-inactive:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.muted}"
    rounded: "{rounded.pill}"
    padding: "4px 8px"
  panel:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.card}"
  release-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.card}"
    padding: "16px 16px 20px"
  play-button:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.circle}"
    size: "48px"
---

# Design System: Trakko

## Overview

**Creative North Star: "Daylight notebook"**

Trakko feels like a generous daylight studio: pale sky surrounds paper surfaces, near-black type sets the hierarchy, and charcoal pill actions give the interface a clear point of emphasis. Medium-weight, regular-width Inter connects expressive marketing with practical producer tools. Soft lavender, peach, and powder-blue washes add warmth without competing with music.

The user-supplied Geniestudio reference governs this system across marketing, dashboard, authentication, and the default light storefront. Trakko adapts it with locally served Inter in place of Aeonik/Geist, an interactive paper-stack listening room, real playable demo releases, and lavender/peach/powder-blue instead of mint. Producer-selected dark themes and custom accents retain their own surface and contrast tokens.

**Key Characteristics:**

- Pale sky canvas and paper cards with tonal, mostly flat depth.
- Regular-width Inter at weight 500 for display and principal headings.
- Generous rounded cards, pill actions, and clearly labeled native fields.
- A functional listening room with measured audio waveforms, paper depth, and genuine release playback.
- Producer-owned storefront themes, readable task screens, and explicit demo states.

The current implementation is documented from the final daylight block in `src/app/globals.css`, `src/app/layout.tsx`, `src/components/landing.tsx`, and `src/components/release-showcase.tsx`, with desktop, tablet, phone, dashboard, storefront (including dark), and authentication captures under `.impeccable/review/daylight-*.png`. The final current-direction block in `.impeccable/surfaces/src-components-landing-tsx.md` carries homepage strategy; older direction blocks are historical.

## Colors

### Primary

Charcoal (`ink`) anchors filled platform actions; Iris Blue (`accent`) identifies links, focus, and small interactive emphasis. Blue is punctuation rather than a filled primary CTA.

### Secondary

Lavender, Peach, and Powder Blue are flat pastel surfaces for feature tiles, promotion, and pricing. The slightly cooler `setup` wash groups onboarding tasks; `sidebar` separates persistent workspace navigation. Limit a section to two pastel washes plus neutral paper. Mint from the supplied reference is deliberately omitted to honor the user's existing no-green preference.

### Neutral

Sky (`bg`) is the ambient platform canvas. Paper (`surface`) is the primary card and field surface; white supports overlays and contrast on dark controls. Ink text (`text`) carries headings, Graphite (`muted`) supports reading, and `line` defines fields, rows, and separators. `surface-2` provides quiet secondary state. Errors retain explicit wording alongside the existing red semantic palette.

**The Surface Ownership Rule.** Apply daylight to platform and default light surfaces; preserve producer-selected dark themes and custom accents through their scoped tokens. Legacy CSS aliases named `--mint` and `--mint-strong` resolve to sky and powder blue; their names do not authorize green branding.

## Typography

**Display and body:** locally served variable Inter (`src/app/fonts/Inter.ttf`, weight range 100–900), exposed through `--font-display` and `--font-body`, with sans-serif fallback. Inter is the supplied reference's allowed substitute; Aeonik and Geist are not loaded.

Display and principal headings use a calm medium voice (500), tight heading tracking, and regular-width letterforms. Body inherits medium weight and slightly tight tracking; explicit compact labels retain their implementation's 600 emphasis. Do not apply a blanket bold prohibition to task labels.

- **Display:** the homepage uses the frontmatter clamp, line height 1.05, and two centered lines. The user-supplied reference authorizes the 148px upper size. Below 760px, use `clamp(46px, 12.4vw, 72px)` and line height 1.08.
- **Headline:** centered marketing section headings scale to 64px; explanatory section headings scale from 36px to 48px. On phones, section sizes are 34px or 40px according to context.
- **Page title:** working-page headings are 40px/1.2 and become 30px below 760px. Keep table and form hierarchy compact.
- **Body:** 14px/1.5 is the global foundation. Marketing introduction is 17px/1.65 with a 64ch measure; on phones it is 14px and 37ch. Supporting marketing text generally stays within 56–65ch.
- **Labels and actions:** working buttons are 13px/500; the main marketing action is 16px/500, becoming 14px on phones. Explicit form labels are 13px/600. Native text-entry fields become 16px on coarse pointers to avoid zoom.

**The Medium Voice Rule.** Use locally served regular-width Inter at weight 500 for display and principal headings. Preserve compact label emphasis where the working UI uses it.

## Layout

Marketing uses a centered container (1200px maximum), desktop gutters (32px), and phone gutters (20px). Section rhythm is generous (commonly 80px), with 24px grid gaps and 32–40px interior spacing. Centered editorial stacks suit marketing; the dashboard keeps its conventional sidebar, topbar, tables, and task hierarchy.

The homepage moves from proposition and floating music artwork to a single dark create-store action, playable demo releases, upload/customize/sell explanation, producer tools, and truthful fee disclosure. Its exact composition belongs to the surface brief rather than every new screen.

Desktop releases use three equal columns with a 24px gap. At 761–1000px, prices sit below release metadata; below 760px, the shelf uses native horizontal scrolling, mandatory snap, 16px gaps, and cards at 88% width. Explanatory and feature grids stack vertically on phones. The desktop hero artwork box is 380 × 270px; phone artwork is 280 × 230px with contain sizing.

Workspace navigation remains 236px wide on desktop and uses its existing mobile drawer. Working cards keep compact content density even when their containers are rounder. Preserve safe-area padding, natural document scrolling, reachable preview/license targets, and the persistent player's clearance.

## Elevation & Depth

Tone and silhouette provide the primary depth: paper sits on sky; pastel groups sit among paper panels. Ordinary content panels and authentication cards have no shadow. Overlay and player shadows remain functional exceptions; the interactive listening console uses a single soft offset shadow to separate it from the fanned pastel papers.

- **Primary control:** `0 1px 2px #0a0d121f` gives the dark action a restrained edge. This is lighter than the reference's heavy ring.
- **Overlay:** `0 24px 80px #04459018` is the current cool, diffuse modal depth token.
- **Persistent player:** `0 -4px 24px #2020240d` separates the listening controls from scrolling content.
- **Preview control:** `0 5px 16px #0003` keeps playback legible over artwork.

**The Paper Depth Rule.** Separate content cards from the canvas with tone and rounded shape. Keep ordinary panels flat; use shadows only for controls, overlays, and the persistent player.

## Shapes

Generous content cards use the `card` radius; artwork and smaller cards use `artwork`; fields use `field`; buttons, filters, tags, and status pills use `pill`. Workspace active navigation keeps its compact 9px corner shape rather than becoming a giant pill. Main working panels become 24px on phones; homepage release tiles retain 32px. Circular playback controls remain circles.

Borders are quiet and functional. Marketing cards usually have no visible border; fields, table rows, separators, and secondary actions retain thin contrast. Do not copy the reference's decorative iris-gradient frame when there is no matching implemented component.

## Components

### Buttons

Dark, medium-weight pills make the next action clear. Standard controls use 12px × 24px padding and a minimum 44px height. The main homepage CTA uses 14px × 32px and a minimum 52px height (48px on phones). Secondary actions use paper, charcoal text, and a quiet line. Fine-pointer hover darkens the primary to `task-hover`; pressing scales to .97. Focus uses a visible 2px accent outline with 4px offset. Disabled controls retain the existing .45 opacity and unavailable cursor.

### Inputs / Fields

Paper fields have a 16px radius, thin line border, 12px × 14px padding, and minimum 44px height. Keep explicit labels, helper/error text, and the native input behavior. Focus has a 2px accent outline with 1px offset; coarse-pointer text inputs use 16px. Checkbox, radio, and range controls retain their own compact native geometry.

### Navigation

Marketing navigation rests directly on sky with the logo left and compact links plus a dark CTA right. The dashboard uses a powder-tinted sidebar, graphite labels, and charcoal active navigation. Preserve current-page semantics and immediate keyboard focus. The producer storefront topbar follows the selected storefront surface tokens.

### Chips / Status

Pills carry short category or written status labels. Store filters use the scoped surface color; selection inverts foreground/background for contrast in both light and dark themes. Status pills stay quiet and readable, with words carrying the meaning rather than color alone.

### Cards / Containers

Paper cards are flat, generous, and usually borderless. Marketing explanation uses 40px horizontal padding and larger vertical space; feature tiles use 32px, reduced to 24px at intermediate widths. Working-panel headings retain their compact inherited padding. Setup uses a cool lavender wash, store promotion uses lavender, and the free-plan/pricing group uses powder blue. Authentication uses one calm paper card on sky.

### Playable releases and persistent player

Release cards show real cover artwork, title, BPM/key, an actual preview control, and starting license price from workspace data. Artwork has a 24px crop radius and 1.2 aspect ratio on the homepage. The 48px white circular play control becomes powder blue when active. Price links use a quiet blue-tinted pill and at least 44px height. Preserve one persistent player across previews; never autoplay audio. The sidecar's isolated playback sample depicts the control only; the app owns audio state.

Fine-pointer artwork hover scales to 1.035 over 500ms; catalog artwork uses the existing 300ms transition. The homepage headline has one bounded 650ms entrance with an 80ms second-line delay. Working control feedback stays brief (120–150ms), the player enters in 220ms, and the drawer uses its established easing. Reduced motion removes headline choreography and decorative artwork transitions. Two original WebGL fields now provide a flowing hero ribbon and a pricing ripple; no generated image is used.

### Interactive listening room

`SignalDeck` replaces the removed generated illustration with an original React/CSS player. Its paper stack adapts the interaction ideas researched at Aceternity 3D Card, Componentry Orbit Card Stack, and 21st.dev WaveformPlayer; no third-party component source is copied and no new runtime dependency is installed.

The console uses the shared player, three real demo tracks, and 64 RMS waveform samples per track derived from the corresponding MP3. A native range input provides keyboard and pointer seeking. Track buttons expose their selection with aria-pressed. Selecting a track during playback switches audio; otherwise it changes the selected preview without autoplay.

Fine-pointer movement tilts the console by at most 3 degrees per axis, with a 200ms ease-out transform transition; pastel papers fan on hover over 300ms. Keyboard focus flattens the console immediately. Reduced motion disables spatial movement, and touch keeps the static stack. Main controls are 44px or larger. Initial navigation and the readable hero remain server-rendered; the loading fallback is scoped to the dashboard so it cannot hide the homepage without JavaScript.

### Daylight shaders and motion control

`DaylightMotion` coordinates the navigation pause/resume control and reduced-motion preference. `DaylightShader` draws original GLSL in two variants: blue/lavender flow behind the hero and blue ripple rings behind pricing. Pointer input deforms the flow; audio playback raises its energy (a playback-state effect, not live frequency analysis).

Each canvas caps drawing at 30fps, device pixel ratio at 1.25, and backing width at 1280px. Intersection and page visibility stop frame scheduling; paused elapsed time resumes without a jump. Reduced motion renders a single still frame. Failed WebGL compilation, unavailable WebGL, or context loss leaves the static CSS field. Buffers, shaders, observers, and event handlers are cleaned up on unmount. Device performance still needs a physical-phone check.

The console floats by 12px over a six-second cycle and is surrounded by nine-second orbit lines. Hover intent, keyboard focus, pause, hidden tabs, and offscreen regions hold the float; touch/coarse-pointer mode removes it. Reduced motion removes spatial loops. Track changes use a 220ms transform/opacity transition for pointer clicks and remain immediate for keyboard activation. Release-card hover lifts by 8px over 250ms, workflow icons move by 4px over 220ms, and CTA arrows nudge by 3px over 150ms. The shared pause control never stops audio or its meaningful progress updates.

## Do's and Don'ts

### Do:

- Do use the sky canvas, paper cards, charcoal actions, and blue link/focus accents.
- Do use local Inter, with weight 500 and tight tracking for principal headings.
- Do preserve real artwork, actual preview controls, accurate prices, and one persistent player.
- Do keep keyboard focus, explicit field labels, native shelf scrolling, and reduced-motion behavior.
- Do retain producer-selected themes and accents.
- Do label demos and simulated purchases and state the 8% sales fee with separate processing charges.
- Do use code-native interactions and measured audio data; do not add AI-generated illustrations.

### Don't:

- Don’t restore the charcoal marketing stage, background shader, or slanted browser-window hero.
- Don’t restore green/mint branding or condensed display lettering.
- Don’t use blue as the platform’s primary button fill or gradients as large decorative surfaces.
- Don’t add shadows to ordinary content cards or introduce sharp corners as the main shape language.
- Don’t borrow customer claims, testimonials, adoption figures, or third-party illustration assets.
- Don’t apply marketing headline choreography or oversized display type to producer task screens.
