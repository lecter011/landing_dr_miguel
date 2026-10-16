# web_drmiguelc

Landing page for Dr. Miguel C. Static HTML + GSAP scroll-scrubbed hero video.

## Folder layout

```
CLAUDE.md        this file (stays at root)
.claude/         Claude Code config + project skills (gsap-scrolltrigger, landing-page-design) — must stay at root
site/            deployable project — only what the live page uses
  index.html     markup only — no inline <style>/<script>
  css/styles.css all page styles
  js/hero-video.js  DMCHero scroll-scrub hero (loaded in <head>, after GSAP CDN)
  js/main.js     page init (hero + reveal-on-scroll), loaded at end of <body>
  assets/        optimized images/video referenced by the page (relative paths: assets/...)
media/           raw/source media, NOT referenced by the page
  images/        originals: logo exports (1-6.png), photos, molar.png
  video/         source hero renders (hero.mp4, hero_fullhd.mp4)
tools/           dev tooling, references, docs
  gsap-public/            GSAP library distribution (+ .zip)
  gsap_video_scrub.skill.md  video-scrub technique notes
  prompt mockup.txt
```

## Rules

- Deploy = upload `site/` contents only.
- Keep code split: styles in `site/css/`, scripts in `site/js/`, no inline `<style>`/`<script>` blocks in `index.html`.
- Asset paths in JS resolve against `index.html`, so use `assets/...`. CSS `url()` resolves against `css/`, so use `../assets/...`.
- Page paths are relative to `site/`. New page assets go in `site/assets/`, optimized (webp/jpg, re-encoded video).
- Originals/high-res sources go in `media/`; export optimized copies into `site/assets/`.
- `site/assets/hero.mp4` is re-encoded all-keyframe (`ffmpeg -g 1`) for smooth reverse scrubbing — re-encode the same way if replaced.
- Libraries, skills, reference docs, prompts go in `tools/`.
