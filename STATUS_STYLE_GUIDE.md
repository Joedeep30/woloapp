# WOLO UI Status Style Guide

This guide standardizes status indicators (emoji, colors, aria labels) for use in documentation and future UI components.

Status levels
- ✅ Completed / Terminé
  - Color: green-600
  - Emoji: ✅
  - aria-label: status-completed
- 🚧 In progress / En cours
  - Color: amber-500
  - Emoji: 🚧
  - aria-label: status-in-progress
- ❌ Not started / Non commencée
  - Color: red-600
  - Emoji: ❌
  - aria-label: status-not-started
- 🟡 Needs review / À valider
  - Color: yellow-500
  - Emoji: 🟡
  - aria-label: status-needs-review

Usage
- Documentation: Prefer inline emoji next to items.
- Tables/Lists: Include a legend at top using the 4-status pattern.
- Accessibility: Always include an aria-label or sr-only text for screen readers when used in UI.

React/Next component API (proposed)
- Component: <StatusBadge status="completed|in-progress|not-started|needs-review" label="Optional text" />
- Props:
  - status: enum — required
  - label: string — optional override; otherwise auto from enum
  - size: 'sm' | 'md' | 'lg' — default 'md'
  - className: string

Semantic colors (Tailwind example)
- completed: bg-green-100 text-green-700 border-green-200
- in-progress: bg-amber-100 text-amber-700 border-amber-200
- not-started: bg-red-100 text-red-700 border-red-200
- needs-review: bg-yellow-100 text-yellow-700 border-yellow-200

ARIA example
- <span role="status" aria-label="status-needs-review">🟡</span>

Localization keys (suggested)
- status.completed: "Completed" / "Terminé"
- status.in_progress: "In progress" / "En cours"
- status.not_started: "Not started" / "Non commencée"
- status.needs_review: "Needs review" / "À valider"

Notes
- Keep emoji usage consistent. If moving to icons later, preserve colors and aria.
- For PDFs/print, include a legend near the first status table on each page.
