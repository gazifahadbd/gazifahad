# Gazi Fahad Website — Standalone Edition

This package contains an independently runnable static migration of the complete
published `gazifahad.com` frontend, captured on 6 August 2026.

It includes all 23 public pages, navigation, styling, visible written content,
images, local fonts, and the downloadable CV. Those pages and assets run without
Hostinger and without an internet connection.

## Quick start on Windows

Requirements: Node.js 20 or newer and a modern web browser.

1. Extract or copy this entire `gazifahad.com` folder.
2. Open PowerShell.
3. Run:

```powershell
cd "D:\gazifahad.com"
npm.cmd run serve
```

4. Open <http://localhost:3000>.

Keep the terminal open while viewing the website. Press `Ctrl+C` to stop it.
If the folder is stored elsewhere, replace `D:\gazifahad.com` with its actual
location.

You can also double-click `START-WEBSITE.cmd`, then open the address shown in
its terminal window.

## Troubleshooting

Check that Node.js is installed:

```powershell
node --version
```

If port 3000 is already occupied, run:

```powershell
npm.cmd run serve -- --port 3001
```

Then open <http://localhost:3001>.

Do not open `site/index.html` directly with `file://`. Use the supplied server
so that every page, font, image, and link resolves correctly.

## Moving or publishing the website

### GitHub Pages

The GitHub Actions workflow in `.github/workflows/pages.yml` builds and deploys
the portfolio whenever the default branch is updated. In the repository's
**Settings > Pages**, select **GitHub Actions** as the publishing source.

Run `npm run build` to generate `dist/` locally. The build adjusts page links,
images, stylesheets, and fonts for the `/gazifahad` repository path. The workflow
uses the base path supplied by GitHub Pages, including custom-domain hosting.
The original `site/` directory still works with the local server.

### Other hosting

The complete folder can be copied to another Windows, macOS, or Linux computer
with Node.js 20 or newer. No `npm install` is required because the local server
has no third-party dependencies.

For a Node-compatible server or VPS, copy the complete folder and run:

```text
npm run serve -- --host 0.0.0.0 --port 3000
```

For conventional static hosting, upload the contents of `site/` to the hosting
document root. The provider must support directory index files such as
`about/index.html`. Public deployment still requires hosting, DNS, and HTTPS,
but it does not require Hostinger Website Builder.

## Package structure

```text
gazifahad.com/
├── README.md
├── CLIENT-HANDOFF.md
├── WEBSITE-PAGES.md
├── START-WEBSITE.cmd
├── package.json
├── server.mjs
└── site/
    ├── index.html
    ├── <page>/index.html
    ├── assets/
    └── files/gazi-fahad-cv.pdf
```

## Scope and limitations

This delivery is a standalone migration of the published website frontend, not
an export of Hostinger's proprietary drag-and-drop editor. It does not include
unpublished pages, Hostinger account settings, private records, databases, form
submissions, analytics data, or the original visual editor. Content changes
currently require editing the static website files or further development.

The package is a dated snapshot and will not automatically synchronize with
future changes to the former hosted version. External social-media, email,
university, and scholarly-profile links still require their corresponding
services and an internet connection.
