# Project 03 — Marketing Media Pipeline (Image + Video)

## Purpose
Build an automated, user-friendly, premium-feeling marketing studio for real estate listings that handles both image and video workflows from source assets through social publishing.

This is the project that should feel:
- seamless
- sharp
- futuristic but tasteful
- highly guided
- easy to review and approve
- aligned with Excel Legacy Realty Team branding

## Primary goal
When a property is ready to market, the system should guide the user through a repeatable flow:
1. find the property assets
2. generate branded image variations
3. generate branded video variations
4. polish in Canva or the chosen editor
5. update Lofty landing pages
6. generate social captions
7. publish or queue social posts
8. save everything back to the correct property folder
9. log the activity in the CRM

## Brand direction
- Dark luxury UI base
- Black / charcoal surfaces
- Deep blue primary actions
- Gold premium accents
- White/off-white readable text
- Subtle teal/cyan for AI/automation states
- Clean cards, glass-like panels, soft shadows, crisp spacing
- Minimal clutter, no confusing admin noise

## User experience requirements
The workflow must feel like a guided command center:
- one clear property at a time
- obvious next step
- sticky action bar
- progress tracker
- preview-first layout
- smart defaults
- autosave
- easy undo / retry
- no hidden workflow actions

## Source asset logic
Search in this order:
1. `\\excelserver\\WeichertShare\\1 LISTINGS\\2026 Listings\\{Property Folder}`
2. MLS exports/downloads
3. Downloads folder
4. Desktop folder
5. Photographer folder if separate

If the folder is missing:
- show a clear manual review state
- suggest likely matches
- let the user confirm the property
- do not silently fail

## Listing stages supported
- Coming Soon
- Just Listed
- Open House
- Price Improvement
- Just Sold

## Image workflow
### Flow
1. Select source hero photo.
2. Generate day and night versions.
3. Use Magnific with the free model path and the Google Nano Banana / Nano Banana style workflow if applicable.
4. Support 16:9 wide and 4:3 classic ratios.
5. Generate 3–4 variants per version when needed.
6. Add branded text, city/town, address, and Excel Legacy Team logo treatment.
7. Save generated outputs back to the property folder.
8. Send final image assets to Canva for polishing.

### Image UI requirements
- source photo thumbnails
- ratio picker
- stage picker
- day/night toggle
- variation gallery
- prompt preview/edit box
- approve/reject controls
- final export panel

### Prompt logic
- Use season-aware prompts based on Michigan date/time.
- Day prompts should feel bright, clean, and market-ready.
- Night prompts should show lights on, moon/stars, and appealing depth.
- Branding should use the property stage and company colors naturally.

## Video workflow
### Flow
1. Find source clips.
2. Select best clips by scene type.
3. Assemble promo or walkthrough video.
4. Add logo, stage text, address, and CTA.
5. Add captions/subtitles if required.
6. Export 9:16, 16:9, and optionally 1:1 versions.
7. Save back to the property folder.
8. Use the finished video for Lofty and social publishing.

### Video types to support
- Coming Soon teaser
- Just Listed promo
- Open House invite
- Price Improvement announcement
- Just Sold celebration
- walkthrough reel
- landing page hero video

### Video UI requirements
- clip timeline
- selected footage panel
- output format selector
- music/voiceover options
- caption toggle
- thumbnail preview
- render/export status
- version history

## Folder organization
Use a numbered lifecycle structure if possible:
- `01_Source_Photos`
- `02_Source_Video`
- `03_Magnific_Images`
- `04_Canva_Exports`
- `05_Video_Exports`
- `06_Lofty`
- `07_Social`
- `08_Final_Approved`

## Lofty landing page workflow
- open or create the property landing page
- rename it to the address
- fill MLS-driven fields
- insert the latest approved image/video
- set analytics/pixel settings via config, not hard-coded secrets
- set popup browsing time to 7 seconds if that is the business rule
- preview before publish
- publish/update only after approval

## Social caption generation
- Generate platform-specific captions for Facebook, LinkedIn, and Instagram.
- Support tone options such as luxury, warm, modern, professional, concise.
- Include address, stage label, highlights, and CTA.
- Keep language compliance-safe and brand-safe.

## Publishing workflow
- Publish or queue to Facebook business page, LinkedIn, and Instagram.
- Attach the correct media and landing page link.
- Log every publish action in the CRM.
- Show publish status in the UI.

## Compliance and approval
- Broker/owner approval must be visible where public marketing is involved.
- Keep ad compliance, fair housing, and opt-out rules visible.
- Preserve audit logging for every generated asset and post.
- Do not bypass approvals for public-facing channels.

## Build approach
1. Inspect the existing UI and file handling patterns.
2. Create the media pipeline state model and UI shell.
3. Add image workflow first, then video.
4. Add landing page and caption generation.
5. Add approval and logging states.
6. Add social publish hooks or integrations.
7. Verify with lint and build.
8. Fix any regressions before stopping.

## Files likely involved
- dashboard/CRM/workflow pages
- new media pipeline components
- shared folder/path helpers
- prompt/caption helpers
- landing page integration helpers
- social publish helpers
- CRM activity logging helpers

## Guardrails
- Keep it TypeScript-first.
- Keep the UI simple and premium.
- Do not put secrets in source.
- Do not make the flow feel like a generic admin tool.
- Do not hard-code external account credentials.
- Preserve manual review checkpoints before publishing.

## Acceptance criteria
- A user can move through the full image + video media flow cleanly.
- Assets are saved in the correct property folder.
- Generated outputs are easy to preview and approve.
- Lofty and social steps are guided and visible.
- The UI looks sharp, polished, and futuristic in a tasteful way.
- The code builds successfully.

## Output required from Jules
- Summary of implemented UI/workflow changes.
- Files created or modified.
- Any remaining integration gaps.
- Lint/build confirmation.

## Stop condition
Stop after this project is complete. Do not start deployment work automatically.
