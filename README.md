# IFC Viewer

Ein einfacher IFC Viewer basierend auf [ThatOpen](https://github.com/ThatOpen) (ehemals IFC.js).

## Features

- 🏗️ IFC-Dateien laden per Drag & Drop oder Button
- 🖱️ Orbit/Pan/Zoom Navigation
- 🎯 Objekt-Highlighting bei Klick
- 📊 Properties Panel (Express IDs)

## Lokale Entwicklung

```bash
# Dependencies installieren
npm install

# Dev Server starten
npm run dev
```

Dann öffne http://localhost:5173

## GitHub Pages Deployment

1. Erstelle ein neues Repository auf GitHub
2. **Wichtig:** Passe in `vite.config.ts` die `base` Einstellung an:
   ```ts
   base: '/DEIN-REPO-NAME/',
   ```
3. Push den Code:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/DEIN-USERNAME/DEIN-REPO-NAME.git
   git push -u origin main
   ```
4. Gehe zu Repository Settings → Pages → Source: "GitHub Actions"
5. Der Workflow baut und deployed automatisch bei jedem Push

## Technologien

- [ThatOpen Engine](https://docs.thatopen.com/) - BIM Components
- [Three.js](https://threejs.org/) - 3D Rendering
- [web-ifc](https://github.com/ThatOpen/engine_web-ifc) - IFC Parser (WASM)
- [Vite](https://vitejs.dev/) - Build Tool

## Nächste Schritte

- [ ] IfcPropertiesManager für vollständige Property-Anzeige
- [ ] Model Tree (IfcRelationsIndexer)
- [ ] Integration mit CesiumJS
- [ ] Firebase Authentication

## Lizenz

MIT
