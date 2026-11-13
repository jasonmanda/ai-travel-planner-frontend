# Connexion Angular ↔ Spring Boot

## 1. Configuration

Le frontend appelle par défaut `http://localhost:8080/api/v1`.
Modifiez `src/environments/environment.ts` si le backend écoute sur une autre adresse.

## 2. Client HTTP Angular

`src/main.ts` doit enregistrer `provideHttpClient()` dans les providers. C'est déjà fait dans ce projet.

`src/app/trip.service.ts` centralise les appels HTTP :

| Méthode Angular | Méthode HTTP | Endpoint Spring Boot | Usage |
|---|---|---|---|
| `getDestinations()` | GET | `/api/v1/destinations` | Charger le catalogue |
| `createTrip(data)` | POST | `/api/v1/trips` | Créer la demande et obtenir son UUID |
| `getTrip(id)` | GET | `/api/v1/trips/{id}` | Relire une demande |
| `generateRecommendations(id)` | POST | `/api/v1/trips/{id}/recommendations` | Calculer et enregistrer les recommandations |
| `getRecommendations(id)` | GET | `/api/v1/trips/{id}/recommendations` | Relire les recommandations enregistrées |

## 3. Parcours du formulaire

Le composant `AppComponent` utilise déjà `TripService` :
1. Le formulaire appelle `generateRecommendations()`.
2. Angular envoie `POST /trips` avec les critères du voyage.
3. Spring Boot enregistre la demande et renvoie `id` (UUID).
4. Angular envoie `POST /trips/{id}/recommendations`.
5. Spring Boot calcule les recommandations à partir du catalogue PostgreSQL.
6. Angular affiche les destinations renvoyées.

## 4. Lancer les applications

Terminal 1 — backend :

```bash
cd ai-travel-planner-backend
mvn spring-boot:run
```

Terminal 2 — frontend :

```bash
cd ai-travel-planner-frontend-connected
npm install
npm start
```

Ouvrir `http://localhost:4200`.

## 5. CORS

Le backend autorise par défaut `http://localhost:4200` via `app.cors.allowed-origins`.
Si le frontend utilise un autre port ou domaine, configurez `CORS_ALLOWED_ORIGINS` côté backend.

## 6. Vérification API sans Angular

```bash
curl -i http://localhost:8080/api/v1/destinations
```

Créer une demande :

```bash
curl -i -X POST http://localhost:8080/api/v1/trips \
  -H 'Content-Type: application/json' \
  -d '{
    "departureCity":"Dakar, Sénégal",
    "nationality":"Sénégalaise",
    "adults":2,
    "children":0,
    "budget":1500000,
    "currency":"XOF",
    "duration":7,
    "travelPeriod":"Dates flexibles",
    "travelStyle":"En couple",
    "destinationScope":"Afrique et monde",
    "interests":["Plage","Culture","Gastronomie"]
  }'
```

Copier le champ `id` retourné, puis :

```bash
curl -i -X POST http://localhost:8080/api/v1/trips/UUID_RETOURNE/recommendations
```

## Important

- Le backend doit être démarré et sa base PostgreSQL initialisée avant de tester Angular.
- Les recommandations actuelles reposent sur le scoring déterministe et les données du catalogue. L'orchestration OpenAI n'est pas encore branchée.
- Les budgets sont indicatifs et ne constituent pas des tarifs vérifiés.
