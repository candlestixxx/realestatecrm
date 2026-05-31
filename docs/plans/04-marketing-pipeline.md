# 04 — Marketing Pipeline: Listing Media

## Overview

Status-driven marketing pipeline that generates finished assets for each listing at every lifecycle stage: Coming Soon → Just Listed → Open House → Price Improvement → Just Sold.

## Pipeline Flow

```
Property photos → Magnific (AI render) → Canva (brand polish) → Lofty (landing page) → Social publish
```

## Stage 1: Source Property Photos

**Priority order:**
1. Network share: `\\excelserver\WeichertShare\1 LISTINGS\2026 Listings\[Address]`
2. MLS export
3. Local Downloads/Desktop

**Resolution:** Match by address or listing folder name.

## Stage 2: Generate AI Renders (Magnific)

For each property, generate:

| Variant | Description |
|---------|-------------|
| Day exterior | Sunlit, curb appeal |
| Night exterior | Interior/exterior lighting, sky depth |
| Day interior | Room shots with natural light |
| Night interior | Warm lighting ambiance |

**Branding:** Apply Excel Legacy Realty Team logo overlay and color-safe text.

## Stage 3: Design Polish (Canva)

Take Magnific renders and apply:

- Property address overlay
- Agent name and contact info
- Status badge: Coming Soon / Just Listed / Open House / etc.
- Brand colors (black/blue/gold)
- MLS number
- Price (if applicable)

**Export formats:**
- Social media square (1080×1080)
- Social media landscape (1200×628)
- Print flyer (8.5×11)
- Postcard (6×4 or 4×6)

## Stage 4: Create/Update Landing Page (Lofty)

1. Create or update property page in Lofty
2. Set address and title
3. Inject analytics: GA G-HCMP10SZR, Facebook Pixel 3479529585645081
4. Swap in latest hero image
5. Set property details (beds, baths, sqft, price)

## Stage 5: Generate Marketing Copy

Use LLM to generate platform-specific copy:

| Platform | Style | Length |
|----------|-------|--------|
| Facebook | Conversational, emoji, CTA | 100-200 words |
| LinkedIn | Professional, data-driven | 150-250 words |
| Instagram | Visual-first, hashtags | 50-100 words + 20 hashtags |
| Email | Personal, detailed | 200-400 words |

## Stage 6: Publish

### Social Media

| Platform | Method |
|----------|--------|
| Facebook | Manual publish or API |
| LinkedIn | Manual publish or API |
| Instagram | Manual publish (requires mobile approval) |

### Email Campaign

- Send to buyer list
- Include hero image, property details, CTA

### Lofty Landing Page

- Auto-published when page is created/updated

## Asset Organization

```
\\excelserver\WeichertShare\1 LISTINGS\2026 Listings\
  [Property Address]\
    originals\          # Source photos from MLS/agent
    magnific\           # AI-generated renders
    canva\              # Branded designs
    exports\            # Final platform-ready files
    social\             # Published social posts
    landing-page\       # Lofty page screenshots/notes
```

## Video Assets

| Type | Duration | Use |
|------|----------|-----|
| Property tour | 60-90s | YouTube, landing page |
| Walkthrough | 30-60s | Instagram Reels, TikTok |
| Drone aerial | 15-30s | Social media teasers |
| Slider montage | 15-30s | Facebook, Instagram Stories |

**Source:** Listing folder / MLS / Downloads / Desktop
**Edit:** Property promo edits, captions, thumbnails, voiceover
**Save:** Alongside image workflow in property folder

## Status-Driven Triggers

| Status | Assets Generated |
|--------|-----------------|
| Coming Soon | Day exterior render, teaser social post |
| Just Listed | Full set (day/night, ext/int), all social, landing page, email blast |
| Open House | Open house flyer, event post, reminder email |
| Price Improvement | Updated flyer, price drop social post |
| Just Sold | Sold graphic, testimonial request, market update post |

## Human Review Gates

- ✅ Review AI renders before using (Magnific output)
- ✅ Review Canva designs before export
- ✅ Review marketing copy before publishing
- ✅ Review landing page before going live
- ✅ Review social posts before publishing
- **Never auto-publish without human approval**

## Folder Hierarchy (Numbered)

```
01 - Source Photos
02 - AI Renders
03 - Design Drafts
04 - Final Exports
05 - Published Assets
06 - Landing Page
07 - Social Posts
08 - Analytics/Performance
```
