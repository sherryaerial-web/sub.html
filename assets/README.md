# Vendored browser dependency

- `xlsx.full.min.js`: SheetJS Community Edition 0.20.3 browser build.
- Source: https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js
- Documentation: https://docs.sheetjs.com/docs/getting-started/installation/standalone/
- SHA-256: `cc015130aa8521e7f088f88898eba949ccdcbfb38df0bd129b44b7273c3a6f41`

- `jszip.min.js`: JSZip 3.10.1 browser build, used to preserve the salary workbook layout and colors.
- Source: https://stuk.github.io/jszip/
- License: `JSZIP-LICENSE.md`
- SHA-256: `acc7e41455a80765b5fd9c7ee1b8078a6d160bbbca455aeae854de65c947d59e`

The file is stored locally so the admin Excel export does not depend on a third-party CDN at runtime.
