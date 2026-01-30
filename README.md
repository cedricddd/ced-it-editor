# Ced-IT Image Editor

Éditeur d'images web inspiré de ShareX, développé avec React et Fabric.js.

![Ced-IT](public/logo.png)

## Fonctionnalités

### Import d'images
- 📁 Import de fichiers (glisser-déposer ou bouton)
- 📷 Capture caméra (mobile)
- 🖥️ Capture d'écran
- 🎥 Webcam (nécessite HTTPS)

### Outils d'annotation
| Touche | Outil |
|--------|-------|
| 1 | Sélection |
| 2 | Texte |
| 3 | Rectangle |
| 4 | Cercle |
| 5 | Flèche |
| 6 | Surlignage |
| 7 | Masquage (cacher des données sensibles) |
| 8 | Dessin libre |
| 9 | Recadrage |
| 🗑️ | Supprimer la sélection (bouton rouge) |

### Ajustements
- Luminosité
- Contraste
- Saturation

### Export
- Qualité haute (HQ)
- Qualité moyenne (MQ)
- Qualité basse (BQ)
- Export par lot

## Raccourcis clavier

- `Ctrl+S` : Ouvrir le menu d'export
- `←` / `→` : Image précédente / suivante
- `Suppr` : Supprimer les objets sélectionnés
- `1-9` : Sélectionner un outil

## Installation

### Développement local

```bash
npm install
npm run dev
```

### Production

```bash
npm run build
npm run preview
```

### Docker

```bash
docker-compose up -d --build
```

L'application sera disponible sur `http://localhost:4040`

## Technologies

- React 18
- Vite
- Fabric.js
- Tailwind CSS
- Lucide React (icônes)

## Licence

MIT

---

Développé par [Ced-IT](https://ced-it.com)
