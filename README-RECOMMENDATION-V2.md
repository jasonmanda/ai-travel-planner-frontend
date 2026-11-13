# Recommendation UI V2

Cette version du frontend affiche les informations retournées par le moteur de recommandations V2 du backend.

## Nouveaux éléments affichés

- Score global de compatibilité.
- Détail des scores : intérêts, budget, style de voyage et destination préférée.
- Statut de comparaison du budget, y compris lorsque les devises ne sont pas comparables.
- Base et limites de l'estimation.
- Liste explicite des critères qui ne sont pas encore évalués.
- État vide si l'API ne retourne aucune recommandation.

## Compatibilité backend

Utiliser le backend `ai-travel-planner-backend-recommendation-v2` ou une version qui retourne les champs `scoreBreakdown`, `estimateBasis`, `estimateLimitations` et `notEvaluatedCriteria`.

## Lancer

```bash
npm install
npm start
```

API par défaut : `http://localhost:8080/api/v1` dans `src/environments/environment.ts`.
