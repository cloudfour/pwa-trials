# pwa-trials
An area to test out PWA stuff

```
src/
  manifest.json     transformed to /manifest.json
  swconfig.yaml     transformed to /swconfig.json
  assets/           (everything in here is rev-named)
    appshell.css    transformed to /assets/appshell-abc123xyz.css
    appshell.js     transformed to /assets/appshell-abc123xyz.js
    blank.png       transformed to /assets/blank-abc123xyz.png
    portland.svg    transformed to /assets/portland-abc123xyz.svg
    toolkit.css     transformed to /assets/toolkit-abc123xyz.css
    toolkit.js      transformed to /assets/toolkit-abc123xyz.js
  css/
    components/     compiled within appshell.css or toolkit.css
    utils/          compiled within appshell.css or toolkit.css
  js/
    dom/            compiled within appshell.js or toolkit.js
    utils/          compiled within appshell.js or toolkit.js
    vendor/         included as standalone files or via importScripts()
    workers/
      sw.js         transformed to /sw.js

```

```

css/components/button
  core.css
  more.css
  theme.css
```
