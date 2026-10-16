---
version: 1
slug: "src-components-landing-tsx"
primary_target: "src/components/landing.tsx"
related_targets: ["src/components/storefront.tsx","src/components/dashboard-shell.tsx","src/app/globals.css"]
---

# Trakko website redesign

Mode: Persuade on the landing page; Operate on the dashboard and checkout; Experience on producer catalogs.

Audience: independent producers building a beat store and artists finding a beat to license. Preserve truthful demo labeling, the existing feature set, customizable links, private delivery, and the 8% fee.

## Direction contract

THESIS: An independent label’s mail-order catalog makes the music tangible and the business understandable. Refuse the rotated browser mockup, badge-heavy hero, and equal feature-card rows.

OWN-WORLD: Mint fields, evergreen ink, warm white work surfaces, condensed Barlow release lettering, and Public Sans controls. Artwork sits on open shelves; the dashboard stays a conventional, legible working app.

STORY: Understand the free store and fee; hear the actual demo music; create a store; learn upload, licensing, and fulfillment from a compact sequence.

FIRST VIEWPORT: A full-width mint masthead with a large two-line headline, an explicit create-store action, and a broad three-release shelf below. Real audio controls and prices demonstrate the store instead of a browser illustration. On phones, typography stays strong and the release shelf scrolls naturally.

FORM: Grounded candidate 4, independent label mail-order catalog; seed b88aa806. Other candidates: record shop bins, DIY release posters, liner notes, digital crate index, club timetable, festival program. Challenger verdicts: monochrome marketing declined for weak producer identity; cassette j-card declined for unclear business navigation; theatrical cyclorama declined for weak task clarity. Raises: proof follows claims; music holds the visual center; major color fields establish hierarchy. Signature interaction: immediate preview playback with one persistent player, plus restrained press feedback.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Studio edition — October 8, 2026

User asks for a much stronger design, browsing Aceternity and Componentry, shaders, typography, text animation, and motion throughout. This amplifies the independent label world into its evening listening scene; it retains the established release lettering, evergreen/mint family, product truth, code-first preference, and working-store customization.

THESIS: A producer's music arrives on a dark listening stage, with living spectral light rather than a static color field.
OWN-WORLD: Evergreen night, mint highlights, locally served Barlow Condensed lettering and Public Sans UI. Pale green workflow section supplies deliberate contrast.
STORY: Understand beat stores and the free/8% fee; hear real previews; create a store; see the upload/customize/sell path and producer tools.
FIRST VIEWPORT: Two-line masked headline above a functional create-store action, original animated WebGL light field, and playable demo releases with visible starting prices. Phone layouts retain the CTA and natural shelf scrolling.
FORM: Established label-catalog world amplified, not a new category concept. Material inspiration researched at Componentry WebGL Liquid/Liquid Chrome and Aceternity Text Generate Effect/Dither Shader. Original dependency-free shader and CSS animation implementations; no library source copied. A single authored headline entrance, bounded 30fps shader, pointer hover artwork and feedback throughout; dashboard has no delayed page choreography.
FINISH: Desktop 1440, intermediate 900, mobile 390, storefront and dashboard captures. Verify reduced motion, shader fallback, background pause control, playback, navigation, and purchasing. Fresh finish review and documentation required.

## Current direction: clean creator platform

The user explicitly rejected the previous visual language and typography, then supplied guns.lol with the steer 'a little more minimalist with the colours and more clean'. This user-selected reference governs the replacement; previous label-catalog/Studio directions are superseded. Code-first remains confirmed. No new concept tournament: execute the user's chosen conventional creator-platform reference at full fidelity, adapted to the supplied product truth.

THESIS: A clean, approachable creator platform makes a personal beat store easy to understand and try.
OWN-WORLD: Charcoal and white marketing, muted gray surfaces and strokes, locally served variable Inter across display and UI. Floating compact navigation, centered introduction, open playable demo shelf. Neutral light working screens; producer themes remain owned by producers.
STORY: Understand the product, see free/8% terms, create a store or hear a demo, then learn the three-step process and producer features.
FIRST VIEWPORT: Floating header; regular-width centered two-line headline; restrained gray shader atmosphere; paired create-store/demo actions; real previews and prices. No green color fields, condensed type, oversized decorative footer lettering, borrowed adoption claims, or gun motifs.
FORM: User-selected reference https://guns.lol/, inspected live desktop screenshot and computed font (Satoshi). Adapt its compact navigation and centered type into a quieter palette using licensed self-hosted Inter. Preserve existing accessible motion and shader pause/reduced-motion behavior. No library/source copying.
FINISH: Capture desktop 1440, tablet 900, phone 390 plus dashboard/store/auth; verify playback/purchasing/producer tools and shader fallback/reduced motion. Fresh finish reviewer and accurate canonical DESIGN.md and schema2 sidecar.

## Trakko dynamic hero — October 16, 2026

User explicitly requested guns.lol's slanted dynamic windows. This supersedes the earlier refusal of tilted browser mockups and the prior static shelf topology; it preserves current Inter typography, neutral palette, content truth, 8% fee, and producer workflows. Scope is the homepage hero only.

THESIS: Show both sides of the product together: the producer workspace behind a playable storefront, with perspective giving each a distinct plane.
OWN-WORLD: Current charcoal creator platform, white actions, muted gray chrome; existing demo artwork supplies color. No green branding.
STORY: Read the proposition and fee, create a store or explore the demo, see the catalog workflow and immediately play a preview or view licenses in the foreground window.
FIRST VIEWPORT: Centered existing headline and actions above two overlapping slanted windows; naturally taller hero lets the window bottoms continue below the fold while keeping all controls accessible by scrolling.
FORM: Server-rendered component HeroShowcase, workspace data and live PlayButtons/prices. Desktop perspective1600px, independent opposing rotateX/Y/Z transforms; one bounded800ms settling sequence,80ms stagger. Fine-pointer hover reduces the tilt, keyboard focus flattens immediately, reducedmotion removes spatialmotion. Mobile rear workspace is abbreviated, foreground catalog keeps native horizontal snap/scroll and44px music/price targets. No autoplay audio or new loop.
FINISH: Desktop1440/tablet900/mobile390 screenshots and real playback/license/navigation/reducedmotion checks. Existing12browser workflows, lint/types/build. Detector once; zero non-advisory findings. Final independent review and accurate design documentation.
