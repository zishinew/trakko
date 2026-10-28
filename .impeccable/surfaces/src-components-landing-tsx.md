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

## Current direction: daylight notebook — October 26, 2026

User supplied design-references/geniestudio.md and explicitly confirmed applying it across Trakko. The exact supplied visual language owns this build; the prior dark/tilted-window directions are superseded. Existing code-first workflow remains confirmed. No new aesthetic tournament is appropriate for this user-pinned reference.

THESIS: A generous daylight studio gives independent music room to breathe, with one soft 3D musical object carrying the personality and real playable releases proving the product.
OWN-WORLD: #ebf5ff canvas, #fafdff paper, #0a0d12 ink, #181d27 dark pill actions, #0069e0 accents, lavender/peach washes. Inter500 is the reference's allowed substitute. The supplied148px hero scale overrides the skill's generic96px ceiling. No mint/green due prior explicit preference.
STORY: Read the beat-store proposition; see the original floating music illustration; create a free store or explore; hear actualdemo releases/prices; understand upload/customize/sell; review tools and8% fee.
FIRST VIEWPORT: Centered oversized medium-weight two-line headline and supporting copy on skyblue, then a transparent3D headphone/cassette/cloud render and one dark pill CTA below. No left/right split, shader, browsermockups, decorativekicker, inventedadoptionstats, or testimonials.
FORM: Reference-led centered editorial stacks,32px cards/24px artwork/16px fields/pillcontrols,80px sectionrhythm. ModePersuade homepage,Operate dashboard/auth,Experience publiccatalog. Native44pxmusiccontrols, mobilehorizontalshelf, keyboard/focus/nativeaudio preserved; briefboundedheadlineentrance, reducedmotionstatic; producerdarkthemes still use their own tokens.
FINISH: Desktop1440/tablet900/mobile390, dashboard/store/authcaptures,14browserflows (oldshaderchecksreplacedwithdaylightasset/reducedmotion/JSfallback), lint/types/build, one detector, independentreview andupdateddesignsystem. Originalgeneratedpublic/images/daylight-music.png withexactprompt/provenance sidecar, not third-partyartwork.


## Interactive daylight hero — October 27, 2026

The user requested researching Aceternity UI, Componentry, and 21st.dev for stronger brand-fitting elements, and removing AI-generated images. Preserve the daylight world and all working screens. Replace the generated raster hero with SignalDeck: actual demo audio, measured waveform seeking, selectable tracks, a pointer-reactive paper console, and fanned lavender/peach layers. Research references are Aceternity 3D Card, Componentry Orbit Card Stack, and 21st.dev WaveformPlayer; implementations are original and use no new libraries. This supersedes the illustration requirement above. Keep no autoplay, one shared player, native keyboard seeking, 44px controls, touch-static geometry and reduced-motion safeguards. Remove the generated PNG and provenance sidecar.


## Dynamic daylight motion — October 27, 2026

The user asks for more animations, shaders, and dynamism. This supersedes earlier no-shader/no-loop constraints for the homepage only. Focal moment: original cursor-reactive blue/lavender flow shader behind the listening room, plus a blue ripple shader at pricing. Continuity: actual shared playback changes shader energy and the waveform playhead; pointer track changes crossfade over220ms. Feedback: release cards lift, workflow icons move, CTA arrows nudge. Budget: WebGL draw cap30fps, DPR1.25/backingwidth1280, no offscreen/hidden scheduling; still frame under reduced motion and CSS fallback for unavailable/lost contexts. Six-second idle console float and nine-second orbit lines stop on pause/offscreen/hidden; float settles on hover/focus and is removed on coarse pointers. A single navigation control pauses effects without stopping music. Preserve all product truth and no AI-generated images.


## Removed hero controls — October 28, 2026
The user explicitly requested removing the three hero track-selector pills shown in their screenshot and the pause-effects button. This supersedes the manual pause/control requirements above. Remove the obsolete state and styles; retain automatic reduced motion, offscreen/hidden suspension, playback/seeking, and shaders. The hero follows the demo release selected from the existing release cards.
