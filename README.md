# Landing — Dr. Miguel C.

Static landing page with a GSAP ScrollTrigger scroll-scrubbed hero video.

**Live:** https://lecter011.github.io/landing_dr_miguel/

## Structure

| Folder   | Contents |
|----------|----------|
| `site/`  | Deployable page: `index.html`, `css/`, `js/`, `assets/` |
| `media/` | Source images and videos (not served) |
| `tools/` | GSAP distribution, technique notes, prompts |

## Run locally

Any static server from `site/`, e.g.:

```bash
cd site && python -m http.server 8000
```

Open http://localhost:8000.

## Deploy

Pushing changes under `site/` to `main` triggers `.github/workflows/pages.yml`, which publishes `site/` to GitHub Pages.
