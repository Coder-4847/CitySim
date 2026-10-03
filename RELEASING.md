# CitySim release procedure

Version 1.0.0 uses save schema 5 and migrates versions 1–4.
Node 24 is the tested runtime and the GitHub Actions runtime.

Run `npm test`, `npm run build`, and `npm start`. Inspect a new city and a
previous save, government catalogs, zoning, construction, and browser errors.
`npm run benchmark` measures simulation performance, not browser frame rate.

The Pages workflow tests every push to main before packaging and deploying
only `index.html`, `src/`, and `.nojekyll`. Select GitHub Actions as the Pages
source in repository settings. No dependencies or secrets are shipped to players.
Saves stay in their browser. Localhost saves can move to Pages by JSON export/import.

See [v1 release notes](docs/V1_RELEASE.md) for validation and remaining limits.
Earlier phase reports record historical checkpoints, not current release status.
No redistribution license has been granted.
