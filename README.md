# Jasmeet Singh — Software & Systems

A responsive portfolio built with HTML, CSS, and JavaScript. No package installation is required.

## Open locally on Windows

From this folder in PowerShell:

```powershell
Start-Process .\index.html
```

After editing, save the files and refresh the browser. A local live-reload extension can also serve this directory.

## What changed

- Added Magna International / Cosma IT co-op experience, including Windows support, patch compliance, AD / Entra ID, Intune, application support, and documentation.
- Refreshed all four pages with a shared responsive layout, clearer content hierarchy, and working social and email links.
- Replaced the hero tunnel with a live network map of the real stack (Software, Systems, People hubs with packets moving between tools; hover a tool to trace its connections, tap on phones),
- Added scroll reveals, subtle pointer tilt, reading progress, and page transitions with a local-file fallback.
- Added a motion pause control, device reduced-motion support, and animation suspension when the tunnel is offscreen or the tab is hidden.
- Retained the existing photograph, project information, professional history, and credentials from the original repository.

## Static hosting

Serve the project root, or create a clean static output directory with Node.js:

```sh
node scripts/build.mjs
```

The `dist` folder contains the deployable website. The hosted copy uses Sites; the source ZIP does not change your original GitHub repository or Windows files automatically.
