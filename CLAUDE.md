# web_drmiguelc

Landing page for Dr. Miguel C. Static HTML + GSAP scroll-scrubbed hero video.

## Folder layout

```
CLAUDE.md        this file (stays at root)
.claude/         Claude Code config + project skills (gsap-scrolltrigger, landing-page-design) — must stay at root
site/            deployable project — only what the live page uses
  index.html     markup only — no inline <style>/<script>
  css/styles.css all page styles
  css/icons.css  used Tabler icons only
  js/hero-video.js  DMCHero scroll-scrub hero (deferred, after GSAP CDN)
  js/main.js     page init (hero + reveal-on-scroll), deferred — all scripts use defer to keep order
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
- Hero videos: `site/assets/hero.mp4` (1080p, desktop) and `site/assets/hero-720.mp4` (phones/tablets/touch), both made from `media/video/hero_fullhd.mp4`.
  All-keyframe (`-g 1`) for smooth reverse scrubbing, with the white edge vignette + 1.05 brightness baked into the pixels (no CSS mask/filter on the video — it re-ran every frame and stalled mobile).
  Re-encode with the filter in `tools/hero-bake-filter.txt`:
  `ffmpeg -i media/video/hero_fullhd.mp4 [-vf scale=1280:720] -filter_script:v tools/hero-bake-filter.txt -c:v libx264 -g 1 -crf 23 -preset slow -an -movflags +faststart OUT.mp4`
  (for 720p, scale in a first pass, then bake). Poster = first frame of the baked 1080p video.
- Icons: `site/css/icons.css` holds only the Tabler icons the page uses (CSS masks, `<i class="ti ti-name">`). New icon → add its outline SVG there; don't re-add the webfont.
- Libraries, skills, reference docs, prompts go in `tools/`.
