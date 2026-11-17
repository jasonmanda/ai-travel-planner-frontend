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


## Itinéraire et guide IA

Depuis les résultats de recommandation, choisissez **Construire mon itinéraire** sur une destination. Le frontend appelle le planificateur déterministe :

`POST /api/v1/trips/{tripId}/itinerary?destinationId={destinationId}`

L'itinéraire affiche les journées, les activités éligibles, les statuts de données, les sources disponibles et les avertissements du backend. Les fiches non éligibles ne sont pas ajoutées artificiellement au programme.

Le bouton **Obtenir le guide IA** appelle ensuite :

`POST /api/v1/itineraries/{itineraryId}/ai-guide`

Cette fonctionnalité nécessite l'activation du guide IA dans le backend et une configuration valide du fournisseur :

```bash
export APP_AI_ENABLED=true
export SPRING_AI_MODEL_CHAT=openai
export OPENAI_API_KEY="votre-cle-openai"
export OPENAI_MODEL="gpt-5-mini"
```

Si le guide IA n'est pas activé, la génération de l'itinéraire déterministe reste disponible et l'interface affiche le message d'erreur renvoyé par l'API. La clé API doit rester uniquement côté backend et ne doit jamais être exposée dans Angular.

Les conseils IA interprètent les données de l'itinéraire existant : ils n'ajoutent pas de lieux et ne valident pas les prix, horaires, formalités ou disponibilités.


## Administration du catalogue

Un bouton **Administration** ouvre l'espace de revue du catalogue. L'accès utilise les identifiants HTTP Basic configurés sur le backend avec `APP_ADMIN_USERNAME` et `APP_ADMIN_PASSWORD`.

L'espace permet de :
- parcourir et filtrer les activités et attractions ;
- consulter les valeurs courantes, la source enregistrée et les six champs essentiels ;
- sélectionner uniquement les champs effectivement contrôlés ;
- enregistrer la source, son URL et les notes de vérification via les routes protégées du backend.

Les identifiants restent uniquement en mémoire dans le composant Angular et ne sont pas enregistrés dans le stockage local ou les cookies. En production, servir l'application et l'API exclusivement en HTTPS. Ne cochez jamais un champ sans avoir contrôlé sa valeur dans une preuve adaptée. Les règles d'éligibilité et la classification des sources ne sont pas modifiées par l'interface.
