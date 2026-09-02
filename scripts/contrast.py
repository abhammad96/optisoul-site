#!/usr/bin/env python3
"""
WCAG 2.x contrast checker for Opti Soul's site tokens.

Implements the relative-luminance / contrast-ratio formulas from
https://www.w3.org/TR/WCAG21/#dfn-relative-luminance and
https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio directly (no library),
then evaluates every text/background pair actually consumed in
assets/style.css, for both the light (:root) and dark (.dark) values
defined in assets/tokens.css.

Thresholds (WCAG 2.1 SC 1.4.3 / 1.4.11):
  - normal text:            >= 4.5:1
  - large text (>=24px,
    or >=18.66px and bold):  >= 3:1
  - non-text UI components:  >= 3:1 (SC 1.4.11)

Usage: python3 scripts/contrast.py
Exit code 0 if every pair passes its threshold, 1 otherwise.
"""

import sys

# ---------------------------------------------------------------------------
# 1. WCAG relative luminance + contrast ratio
# ---------------------------------------------------------------------------

def _channel(c8):
    """sRGB 8-bit channel -> linearized channel per WCAG formula."""
    c = c8 / 255.0
    return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4


def hex_to_rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def relative_luminance(hex_color):
    r, g, b = hex_to_rgb(hex_color)
    r, g, b = _channel(r), _channel(g), _channel(b)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contrast_ratio(hex_a, hex_b):
    la = relative_luminance(hex_a)
    lb = relative_luminance(hex_b)
    lighter, darker = max(la, lb), min(la, lb)
    return (lighter + 0.05) / (darker + 0.05)


# ---------------------------------------------------------------------------
# 2. tokens.css values actually consumed by assets/style.css
#    (copied by hand from assets/tokens.css :root / .dark; not derived)
# ---------------------------------------------------------------------------

LIGHT = {
    "background":         "#F2F2ED",
    "card":                "#FFFFFF",
    "foreground":          "#151931",
    "muted-foreground":    "#4B506B",
    "muted":                "#F7F7F4",
    "border":               "#C5C9DB",
    "primary":              "#151931",  # var(--foreground)
    "primary-foreground":   "#F2F2ED",  # var(--background)
    "success":              "#5FD97F",
    "warning":              "#E8A54E",
}

DARK = {
    "background":         "#0D0F1D",
    "card":                "#13172D",
    "foreground":          "#F2F2ED",
    "muted-foreground":    "#9A9EB8",
    "muted":                "#13172D",
    "border":               "#2C304C",
    "primary":              "#F2F2ED",  # var(--foreground)
    "primary-foreground":   "#0D0F1D",  # var(--background)
    "success":              "#5FD97F",
    "warning":              "#E8A54E",
}

# (label, fg_token, bg_token, kind) — kind: "text" (4.5:1) / "large" (3:1) /
# "ui" (3:1, informational only — see note below TEXT_PAIRS).
#
# The task's mandatory gate (decision 1) is "every text/background pair
# actually used" — i.e. the TEXT_PAIRS list. UI_PAIRS below (hairline
# --border dividers, the decorative success checkmark / warning dot that
# always sit next to a text label) are reported for transparency but do
# NOT gate the PASS/FAIL exit code: SC 1.4.11 (non-text contrast) applies
# to a UI component boundary/state only when it is the *sole* means of
# conveying that boundary/state, which is not the case for these purely
# decorative dividers and icons (every icon/state here is paired with a
# text label or a shape/spacing cue). They are listed here, not silently
# dropped, precisely so a human reviewer can judge that call themselves.
TEXT_PAIRS = [
    ("body copy on page background",                "foreground",        "background", "text"),
    ("body copy on card/panel",                      "foreground",        "card",       "text"),
    ("h1/h2/h3 on card/panel",                        "foreground",        "card",       "large"),
    ("h1/h2/h3 on page background",                   "foreground",        "background", "large"),
    ("links / strong on page background",             "foreground",        "background", "text"),
    ("links / strong on card/panel",                  "foreground",        "card",       "text"),
    (".meta / .footer-col a / .tile span on page bg",  "muted-foreground",  "background", "text"),
    (".meta / muted text on card/panel",              "muted-foreground",  "card",       "text"),
    (".site-nav a on header (card)",                  "muted-foreground",  "card",       "text"),
    (".site-nav a:hover/focus on header (card)",      "foreground",        "card",       "text"),
    (".lang-toggle text on --muted",                  "foreground",        "muted",      "text"),
    (".beta-banner text on --muted",                  "muted-foreground",  "muted",      "text"),
    ("[role=tab] on page background",                 "muted-foreground",  "background", "text"),
    ("[role=tab][aria-selected] on --muted",          "foreground",        "muted",      "text"),
    (".step-number on --muted",                       "foreground",        "muted",      "text"),
    (".skip-link text on --primary",                  "primary-foreground","primary",    "text"),
    (".btn-primary text on --primary",                "primary-foreground","primary",    "text"),
    (".btn-secondary text on card/panel",              "foreground",        "card",       "text"),
    ("focus outline / nav-toggle bars on card",        "foreground",        "card",       "ui"),
]

UI_PAIRS = [
    ("border on page background (decorative divider)", "border",  "background", "ui"),
    ("border on card/panel (decorative divider)",       "border",  "card",       "ui"),
    ("success icon (next to text label)",               "success", "background", "ui"),
    ("success icon on card/panel",                       "success", "card",       "ui"),
    ("warning dot on --muted (next to text label)",      "warning", "muted",      "ui"),
]

THRESHOLD = {"text": 4.5, "large": 3.0, "ui": 3.0}


def evaluate(tokens, pairs):
    rows = []
    all_pass = True
    for label, fg_key, bg_key, kind in pairs:
        fg, bg = tokens[fg_key], tokens[bg_key]
        ratio = contrast_ratio(fg, bg)
        threshold = THRESHOLD[kind]
        ok = ratio >= threshold
        all_pass = all_pass and ok
        rows.append((label, fg_key, bg_key, fg, bg, kind, ratio, threshold, ok))
    return rows, all_pass


def print_table(mode_name, rows):
    print(f"\n== {mode_name} ==")
    header = f"{'pair':<42} {'fg':<20} {'bg':<20} {'ratio':>7} {'need':>5}  result"
    print(header)
    print("-" * len(header))
    for label, fg_key, bg_key, fg, bg, kind, ratio, threshold, ok in rows:
        fg_desc = f"{fg_key} {fg}"
        bg_desc = f"{bg_key} {bg}"
        status = "PASS" if ok else "FAIL"
        print(f"{label:<42} {fg_desc:<20} {bg_desc:<20} {ratio:>6.2f}:1 {threshold:>4.1f}:1  {status}")


def main():
    light_text, light_ok = evaluate(LIGHT, TEXT_PAIRS)
    dark_text, dark_ok = evaluate(DARK, TEXT_PAIRS)
    light_ui, _ = evaluate(LIGHT, UI_PAIRS)
    dark_ui, _ = evaluate(DARK, UI_PAIRS)

    print_table("Light mode (:root) — text/background pairs (mandatory, decision 1)", light_text)
    print_table("Dark mode (.dark) — text/background pairs (mandatory, decision 1)", dark_text)
    print_table("Light mode (:root) — decorative non-text UI (informational only)", light_ui)
    print_table("Dark mode (.dark) — decorative non-text UI (informational only)", dark_ui)

    total = len(light_text) + len(dark_text)
    failed = sum(1 for r in light_text + dark_text if not r[-1])
    print(f"\n{total - failed}/{total} mandatory text/background pairs pass their WCAG threshold "
          f"(4.5:1 normal text, 3:1 text >=24px).")
    ui_failed = sum(1 for r in light_ui + dark_ui if not r[-1])
    if ui_failed:
        print(f"NOTE: {ui_failed} decorative non-text UI pair(s) are below 3:1 — informational, "
              f"not part of the mandatory gate (see comment above UI_PAIRS). Flagged for developer awareness.")

    if not (light_ok and dark_ok):
        print("RESULT: FAIL — a mandatory text/background pair is below threshold, see rows marked FAIL above.")
        sys.exit(1)

    print("RESULT: PASS — every mandatory text/background pair meets or exceeds its WCAG threshold.")
    sys.exit(0)


if __name__ == "__main__":
    main()
