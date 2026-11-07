# Brand Guide: Trova TV (`replica-brand`)

## 1. Name & Identity
- **Chosen Name**: **Trova TV** (from Italian *trovare* — "to find, discover")
- **Category**: 10-Foot Living-Room Cinema Programme & Streaming Hub

| Candidate | Style | Notes |
| --- | --- | --- |
| **Trova TV** | Verb / Romance root | Distinct from all major US/UK streaming networks; matches the existing Trova mobile ecosystem |
| Marquee | Metaphor | Classic cinema canopy |
| Cinevault | Compound | Archival focus |
| Lumina TV | Invented | Projection light |
| Auteur | Editorial | Prestige film focus |

## 2. Screening Checks
| Check | Where | Status |
| --- | --- | --- |
| US Trademark | tmsearch.uspto.gov (Class 9, 42) | To run before commercial store distribution |
| Domain | `trovatv.app` | To run at registrar |
| Codebase Sweep | `sweep.py` against `replica/brand.json` | Run on 2026-11-07 — **Clean (0 hits)** |

## 3. Palette (Warm Cinema Gold on Obsidian)
- **Background (`bg`)**: `#040301` (Obsidian)
- **Surface (`surface`)**: `#0D0B07`
- **Elevated Surface (`surface-elevated`)**: `#191610`
- **Primary Brand Accent (`accent` / `focus-ring`)**: `#D4A853` (Marquee Gold — completely distinct from Netflix red `#E50914`, HBO Max blue `#002BE7`, and BBC iPlayer pink `#FF4C98`)
- **Primary Text (`text`)**: `#F5EEE1` (Warm Alabaster, 17.87:1 AAA contrast on `#040301`)

## 4. Logo & Android TV Banner Brief
- **Idea**: A warm gold cinema aperture diamond enclosing the italic serif monogram `T` (`PlayfairDisplay_700Bold_Italic`) on deep obsidian `#040301`.
- **Deliverables**: `icon.png` (1024x1024), `icon-light.png`, and `android/app/src/main/res/drawable/tv_banner.xml` (320x180dp Android TV Leanback banner).

## 5. Voice
- **Three words**: **Editorial** (not pretentious), **Direct** (not noisy), **Cinephile** (not algorithmic).
- **Do / Don't**:
  - Do show real IMDb, Rotten Tomatoes, and Metacritic scores; don't invent opaque "% Match" numbers.
  - Do name the exact award ceremony and year; don't use generic "Critically Acclaimed" hype.
  - Do keep the 10-foot stage calm and silent until the viewer presses Play; don't auto-play loud trailers on focus.
