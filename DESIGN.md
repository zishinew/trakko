---
name: "Trakko"
description: "Clean creator platform with charcoal marketing, neutral light workflows, and regular-width Inter."
colors:
  bg: "#f8f8fa"
  surface: "#ffffff"
  surface-2: "#f0f0f3"
  line: "#e2e2e8"
  text: "#202024"
  muted: "#63636f"
  accent: "#626270"
  ink: "#202024"
  selection: "#d4d4dc"
  auth-field: "#e8e8ec"
  sidebar: "#f2f2f5"
  task-hover: "#323238"
  stage: "#09090b"
  stage-text: "#f4f4f5"
  stage-muted: "#a1a1aa"
  nav-surface: "#141416"
  secondary-surface: "#18181c"
  secondary-text: "#ececf0"
  workflow: "#111113"
  pricing-surface: "#151518"
  marketing-hover: "#dcdce2"
  secondary-hover: "#242429"
  marketing-stroke: "#ffffff12"
  secondary-stroke: "#ffffff18"
  error: "#a52a38"
  error-bg: "#fff1f2"
  error-line: "#efc9cf"
typography:
  display:
    fontFamily: "Inter, sans-serif"
    fontSize: "clamp(48px, 5vw, 64px)"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Inter, sans-serif"
    fontSize: "32px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.03em"
  title:
    fontFamily: "Inter, sans-serif"
    fontSize: "30px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.03em"
  body:
    fontFamily: "Inter, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Inter, sans-serif"
    fontSize: "13px"
    fontWeight: 600
    lineHeight: 1.5
  button:
    fontFamily: "Inter, sans-serif"
    fontSize: "13px"
    fontWeight: 650
    lineHeight: 1.5
rounded:
  field: "7px"
  button: "8px"
  navigation-item: "9px"
  marketing-button: "10px"
  panel: "12px"
  mobile-navigation: "14px"
  marketing-container: "16px"
  circle: "50%"
spacing:
  control-gap: "9px"
  action-gap: "12px"
  mobile-gutter: "20px"
  desktop-gutter: "32px"
  section: "64px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.surface}"
    typography: "{typography.button}"
    rounded: "{rounded.button}"
    padding: "11px 17px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.task-hover}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.text}"
    rounded: "{rounded.button}"
    padding: "11px 17px"
    height: "44px"
  button-marketing:
    backgroundColor: "{colors.stage-text}"
    textColor: "#111114"
    rounded: "{rounded.marketing-button}"
    padding: "12px 20px"
    height: "46px"
  button-marketing-hover:
    backgroundColor: "{colors.marketing-hover}"
  button-marketing-secondary:
    backgroundColor: "{colors.secondary-surface}"
    textColor: "{colors.secondary-text}"
    rounded: "{rounded.marketing-button}"
    padding: "12px 20px"
    height: "46px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.field}"
    padding: "12px 14px"
    height: "44px"
  navigation-active:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.surface}"
    rounded: "{rounded.navigation-item}"
    padding: "11px 12px"
    height: "43px"
  panel:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.panel}"
  status-inactive:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.muted}"
    rounded: "6px"
    padding: "4px 8px"
  showcase-window:
    backgroundColor: "{colors.nav-surface}"
    textColor: "{colors.stage-text}"
    rounded: "{rounded.marketing-container}"
  background-control:
    backgroundColor: "{colors.nav-surface}"
    textColor: "{colors.stage-muted}"
    rounded: "{rounded.field}"
    padding: "8px 12px"
    height: "36px"
---

# Design System: Trakko

## Overview

**Creative North Star: "Clean creator platform"**

Trakko uses a quiet creator-platform identity: charcoal marketing surfaces, white actions, muted gray reading, and regular-width Inter throughout. Music supplies the visual character through actual release artwork and playable previews. The user-selected guns.lol reference informs compact navigation, centered introduction, and overlapping perspective windows in the homepage hero; the confirmed adaptation uses fewer colors and cleaner presentation.

Producer workflows remain neutral and light, with direct controls, readable tables, and flat panels. Producer storefront themes and accents remain producer-owned. The earlier green Studio palette and condensed typography are superseded; atmosphere is now a subdued monochrome field behind marketing only.

**Key Characteristics:**
- Regular-width Inter for both display and working UI.
- Charcoal marketing and neutral light working screens.
- Actual release artwork, preview controls, and one persistent player.
- Restrained, pausable monochrome atmosphere with static fallback.
- Flat working panels, a perspective-window homepage showcase, and clear keyboard focus.

## Colors

The platform palette is quiet and almost monochrome; actual artwork and producer-selected storefront colors provide variation.

### Primary

White marketing actions reverse the dark stage. Charcoal task actions anchor light producer screens. The root `accent` is a muted gray functional focus/selection token; it is not a marketing color field and producer storefronts may override it.

### Neutral

Stage, navigation, workflow, and pricing tones separate marketing regions with small lightness changes. Light background, white surfaces, gray dividers, charcoal text, and muted text support daily work. The legacy CSS aliases `mint` and `mint-strong` now resolve to neutral auth and selection colors; their old names do not authorize green branding.

### Named Rules

**The Surface Ownership Rule.** Keep platform marketing monochrome and producer workflows neutral light; preserve producer-owned storefront theme and accent.

Status pills, chart bars, library card footers, and the dialog backdrop now use neutral gray treatments. Error feedback retains its red semantic treatment. The advisory detector findings include older layered CSS and intentional neutral values; they do not supersede the final cascade.

## Typography

**Display Font:** Inter (sans-serif fallback).  
**Body Font:** Inter (sans-serif fallback).  
**Label/Mono Font:** Inter for labels; `ui-monospace, monospace` for technical strings.

The same regular-width variable face keeps display and controls consistent. The project self-hosts `src/app/fonts/Inter.ttf` using `next/font/local` with weights 100–900 and swap display. Provenance: [Google Fonts Inter source](https://github.com/google/fonts/tree/main/ofl/inter); license at `src/app/fonts/Inter-OFL.txt`. Previous Barlow/Public Sans files may remain on disk but do not define the active root font.

### Hierarchy

- **Display:** the frontmatter role is the marketing hero. At the mobile breakpoint it uses `clamp(34px, 9.6vw, 44px)`, line-height 1.16 and tracking -0.035em.
- **Headline:** dashboard/page headings; mobile size 27px. Storefront producer headings use `clamp(40px, 5vw, 60px)` with line-height 1.12.
- **Title:** marketing section and authentication headings. Marketing section titles become 27px on phones; pricing uses 36px desktop and 30px mobile.
- **Body:** the global reading role. Marketing intro uses 15px, line-height 1.8 and max-width 58ch; phones use 13px and 42ch.
- **Label:** explicit field labels. Release titles are 15px/550; supporting metadata and footer text are intentionally compact.
- **Button:** working controls. Marketing primary actions use weight 600. Numbers in tables and playback use tabular numerals.

**The One Typeface Rule.** Use regular-width Inter for both display and body. Do not restore condensed release lettering.

## Layout

Marketing uses a compact floating navigation container, centered introduction, paired actions, and two overlapping hero windows with the playable shelf inside the foreground storefront. The dark marketing root establishes its own flow to contain the detached navigation margin. Navigation caps at 1100px with 24px top margin and 70px height. The intro caps at 900px; the hero showcase caps at 1060px. The business/footer containers cap at 1104px. Main desktop gutters are 32px and major sections use 64px vertical padding.

Below 1160px navigation receives side margins. At 760px and below, navigation uses 16px margins, 64px height and 14px corners; content gutters become 20px. The hero storefront shelf changes from three columns to a native horizontal scroll-snap strip with 82% width tiles and 14px gaps; hero artwork changes from a 1.25 ratio to 1.65. Pricing stacks into one column. Workflows retain the existing sidebar/drawer, tables, dialogs, safe-area player spacing, and 100dvh app layouts. Coarse-pointer fields use 16px text to avoid zoom.

The hero scene is 620px tall on desktop, 570px between 761px and 1000px, and 600px on phones. Desktop rear/front window widths are 57%/63%; tablet widths are 64%/67%. Phones abbreviate the rear workspace and use 90%/95% widths with a 115px foreground top offset. The composition continues below the first viewport and remains reachable by normal page scrolling.

These are surface patterns, not a requirement to center every working screen. Preserve the current screen’s functional information structure.

## Elevation & Depth

Working surfaces remain flat and use strokes or tonal separation. Floating marketing navigation and pricing gain distinction from shallow tonal steps and translucent white borders. The authored gray WebGL field is subdued to 0.55 opacity behind the introduction; the CSS radial gradient remains available without graphics. Original code caps animation at roughly 30fps, freezes offscreen/hidden/manual pause, uses time zero for reduced motion, and limits resolution to 1440px wide with capped pixel ratios.

The homepage showcase alone adds two independently tilted window planes under 1600px perspective (1200px on phones), a thin translucent stroke, and structural dark shadow. The user explicitly requested this extension of the clean creator-platform world. It supersedes the old surface brief’s refusal of rotated browser mockups without changing flat producer workflows.

### Shadow Vocabulary

- **Overlay:** `0 24px 80px #20202430`, via the root overlay token.
- **Player:** `0 -4px 24px #2020240d` above catalog content.
- **Authentication:** `0 18px 45px #20202410` against its neutral field.
- **Preview control:** `0 5px 16px #0003` over artwork.
- **Hero window:** `0 28px 60px #0008` separates the two homepage showcase planes.

**The Working Surface Rule.** Keep working panels flat at rest. Reserve diffuse shadows for dialogs, authentication cards, the persistent player, and the homepage showcase windows.

## Shapes

Gentle rounding distinguishes controls from larger containers. Fields use the field radius, working buttons the button radius, and panel/artwork containers the panel radius. Marketing actions are slightly softer; floating navigation/pricing containers use the marketing-container radius, reducing on phones. Playback remains circular. Thin dividers and quiet strokes organize content without decoration.

## Components

### Buttons

Working primary buttons are charcoal with white text; secondary actions are transparent with a gray stroke. Both use a 44px minimum height and compact padding. Marketing actions reverse to white on charcoal with a darker secondary action. Their hero minimum height is 46px. Fine-pointer hover uses the extracted hover tones, arrows move 3px, and press feedback scales to 0.97. Keyboard focus uses a 2px accent outline with 4px offset. Danger actions retain semantic error colors. Reduced motion removes transitions.

### Chips

Statuses pair color with written labels. Inactive pills use the neutral surface and muted text. Published pills use a neutral tint with an explicit written status.

### Cards / Containers

Working panels use white backgrounds, gray borders, flat depth, and 20px 22px header padding. In the homepage hero, release artwork sits in the foreground storefront window with rounded clipping; that window uses the marketing-container radius and a translucent white stroke. Pricing uses its own shallow dark surface and quiet white stroke. Keep original supplied/demo art rather than recoloring music assets to match the platform.

### Inputs / Fields

Native fields use white backgrounds, gray strokes, field rounding and 12px 14px padding with a 44px minimum height. Labels are explicit. Focus uses a 2px accent outline with 1px offset; placeholders use muted text. Border/shadow changes last 150ms. Disabled buttons remain dimmed with a not-allowed cursor; error messages remain written and semantically colored.

### Navigation

Marketing navigation floats inside a rounded dark container; muted links and a white primary action stay compact. Workspace navigation uses a neutral light sidebar, 13px/550 links, 9px corners, and a charcoal current-page state. Mobile uses the existing functional drawer with safe-area behavior and focus management.

### Perspective hero showcase

The rear linked workspace preview uses the actual demo catalog and opens the producer beats workspace. The foreground storefront contains three real demo releases, live preview buttons connected to the persistent player, and starting-price links to licenses. Both surfaces are explicitly labeled demo; the rear upload treatment belongs to the preview link rather than a separate working upload control. The producer link opens the demo store. Existing artwork supplies color, with no copied reference imagery.

At desktop rest, the rear plane uses rotateX(8deg), rotateY(13deg), rotateZ(-7deg); the front uses rotateX(7deg), rotateY(-13deg), rotateZ(6deg). CSS settles each plane once over 800ms, staggering the foreground by 80ms, using backwards fill and explicit opacity 1 at the end. There is no new looping motion or JavaScript animation. Fine-pointer hover reduces the angles over 500ms and lifts by 6px. Focus within either window flattens it immediately and raises its stacking order to 3, preserving reachable controls.

Phones use static opposing rotations of -5deg/+3deg, omit the entrance, abbreviate the rear preview, and preserve natural shelf scrolling. Playback and license targets grow from 36px on desktop to at least 44px on phones. Reduced motion removes both window animations, transitions, and transforms, including hover tilt.

### Preview and atmosphere controls

Release preview buttons remain circular, keyboard accessible, and wired to the shared persistent player. Fine-pointer artwork grows gently over 500ms; storefront artwork uses 300ms. The visible Pause/Resume background button uses a 36px minimum height and pressed state; it controls only background motion. The two-line hero entrance lasts 650ms with a 110ms second-line delay. Reduced-motion mode removes the entrance and transitions, while preview audio remains a deliberate user action.

## Do's and Don'ts

### Do:
- Do use regular-width Inter and the extracted neutral platform tokens.
- Do preserve real artwork, clear preview controls, and a single persistent player.
- Do keep visible keyboard focus, explicit status wording, and coarse-pointer input sizing.
- Do keep background atmosphere bounded, pausable, and readable with a static fallback.
- Do preserve the producer’s selected storefront theme and accent.
- Do label demo releases, simulated purchases, and illustrative figures clearly.
- Do preserve real playback and license links within the perspective hero, with immediate keyboard flattening and a static reduced-motion layout.

### Don't:
- Don’t restore green marketing fields or condensed typography.
- Don’t add oversized decorative footer lettering.
- Don’t introduce borrowed adoption claims, gun motifs, or third-party source-copy claims.
- Don’t apply background shaders or delayed headline choreography to producer task screens.
- Don’t freeze transient control feedback when the background is paused.
- Don’t promote remaining localized legacy accents into the new brand palette.


Green platform tints, status treatments, chart fills, demo avatar/artwork accents, and the default store accent have been neutralized. New stores default to #626270; demo sessions carrying the former #177965 default read as neutral without resetting their music, orders, or settings. Producer-selected custom accents remain available.
