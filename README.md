# Abhishek KS — Portfolio

Personal portfolio site. Static HTML/CSS/JS, no build step, deployable as-is to
GitHub Pages, Netlify, Vercel, or any static host.

## Structure

```
portfolio/
├── index.html          # Page markup
├── css/
│   └── styles.css      # All styles
├── js/
│   └── main.js         # Pixel-art canvases + energy spine + scroll reveal
├── assets/             # Images / downloads (resume, favicon, etc.)
└── README.md
```

## Run locally

Any static server works. Two quick options:

```bash
# Python
python3 -m http.server 5173

# Node
npx serve .
```

Then open <http://localhost:5173>.

## Deploy to GitHub Pages

1. Push this folder to a repo (e.g. `Abhishekmystic-KS/portfolio`).
2. In repo **Settings → Pages**, set source to `Deploy from a branch` → `main` → `/ (root)`.
3. Visit `https://<username>.github.io/<repo>/`.

## Sections

- Hero with a pixel-art black hole
- About / Experience
- Selected projects (AI Image Restoration, Friday — J.A.R.V.I.S)
- Skills (orbital canvas: pulsar core + planets + neutron star + Claude CLI satellite)
- Hackathons (Lunar DEM @ ISRO, Unified Chain ID @ NMIT)
- Contact
