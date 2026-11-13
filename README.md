# Voyagea — AI Travel Planner (frontend MVP)

Prototype Angular standalone en français. Le formulaire est maintenant connecté au backend Spring Boot via `TripService`.

## Prérequis
- Node.js 20.19+ ou 22.12+
- npm
- Backend démarré sur `http://localhost:8080`

## Démarrage
```bash
npm install
npm start
```
Puis ouvrir http://localhost:4200.

## Build
```bash
npm run build
```

## Intégration API
Le service `src/app/trip.service.ts` appelle :
- `POST http://localhost:8080/api/v1/trips`
- `POST http://localhost:8080/api/v1/trips/{id}/recommendations`

L'URL est actuellement définie dans `trip.service.ts` pour le développement local. Elle devra être déplacée dans les fichiers d'environnement Angular avant déploiement.

Les budgets renvoyés sont des estimations calculées à partir du catalogue de démonstration du backend. Ils ne sont pas des prix vérifiés et ne couvrent pas nécessairement les vols, visas, assurances ou frais réels d'hébergement.
