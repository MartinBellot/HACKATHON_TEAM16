# Carbon Calculator

Application fullstack pour calculer l'empreinte carbone d'un site physique incluant matériaux de construction et exploitation.

**Hackathon Capgemini x Sup de Vinci - Rennes - 16 & 17 Mars 2026**

## Architecture

```
Frontend (Angular 17 + PWA)
    ↓
Backend (Spring Boot 3.2 + JWT)
    ↓
PostgreSQL 15
```

## Technologies

**Backend**
- Java 17
- Spring Boot 3.2
- Spring Security + JWT
- PostgreSQL 15

**Frontend**
- Angular 17
- TypeScript
- Chart.js
- PWA

## Démarrage

Voir [DOCKER.md](./DOCKER.md) pour les instructions de démarrage.

**TL;DR:**
```bash
docker-compose up -d
```

Accès : http://localhost:4200

## Fonctionnalités

- Calcul de l'empreinte carbone (construction + exploitation)
- Dashboard avec KPIs et graphiques interactifs
- Authentification JWT
- Application PWA (mobile-friendly)
- Facteurs d'émission ADEME

## Calculs Carbone

### Facteurs d'émission (ADEME)

**Matériaux de construction (kgCO₂e/tonne):**
- Béton : 235
- Acier : 1,850
- Verre : 850
- Bois : -500 (capture carbone)

**Énergie:**
- Mix électrique français 2025 : 57 kgCO₂e/MWh

**Parking:**
- 150 kgCO₂e/place/an

### Formules

```
CO₂_construction = (béton × 1000 × 235) + (acier × 1000 × 1850) + ...
CO₂_exploitation = (énergie × 1000 × 57) + (parking × 150)
CO₂_total = CO₂_construction + CO₂_exploitation
```

## API Endpoints

```
POST   /api/auth/signup       - Inscription
POST   /api/auth/signin       - Connexion
GET    /api/sites             - Liste des sites
POST   /api/sites             - Créer un site
GET    /api/sites/my-sites    - Mes sites
GET    /api/sites/stats       - Statistiques
```

## Structure du Projet

```
carbon-calculator/
├── backend/              # Spring Boot API
│   ├── src/
│   │   └── main/java/com/capgemini/carbon/
│   │       ├── controller/
│   │       ├── service/
│   │       ├── model/
│   │       ├── repository/
│   │       └── security/
│   └── Dockerfile
├── frontend/             # Angular PWA
│   ├── src/app/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── services/
│   │   └── models/
│   ├── nginx.conf
│   └── Dockerfile
├── docker-compose.yml
└── DOCKER.md
```
