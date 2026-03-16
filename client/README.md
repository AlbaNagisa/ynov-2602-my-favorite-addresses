# Client - My Favorite Addresses

Frontend React + Vite connecte a l'API du dossier `server` **sans modifier le backend**.

## Fonctionnalites

- Creation de compte (`POST /api/users`)
- Connexion et stockage du token (`POST /api/users/tokens`)
- Chargement du profil connecte (`GET /api/users/me`)
- Ajout d'adresse (`POST /api/addresses`)
- Liste des adresses (`GET /api/addresses`)
- Recherche par rayon (`POST /api/addresses/searches`)

## Lancer le projet

1. Demarrer le backend (dans `server`):
   - `yarn`
   - `yarn dev`
2. Demarrer le frontend (dans `client`):
   - `npm install`
   - `npm run dev`
3. Ouvrir `http://localhost:5173`

## Pourquoi ca marche sans CORS

Le frontend appelle `/api/*` et Vite proxy vers `http://localhost:3000`, ce qui evite de modifier la config CORS du backend.
