# CO₂nscient - Démarrage Docker

## Prérequis
- Docker Desktop installé et démarré
- Ports disponibles : 4200, 9000, 5433

## Démarrage

### 1. Lancer l'application
```bash
docker-compose up -d
```

### 2. Vérifier les conteneurs
```bash
docker-compose ps
```

Vous devriez voir 3 conteneurs :
- `carbon-calculator-frontend` (port 4200)
- `carbon-calculator-backend` (port 9000)
- `carbon-calculator-db` (port 5433)

### 3. Accéder à l'application
- Frontend : http://localhost:4200
- Backend API : http://localhost:9000

## Commandes utiles

### Voir les logs
```bash
# Tous les services
docker-compose logs -f

# Un service spécifique
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Arrêter l'application
```bash
docker-compose down
```

### Redémarrer un service
```bash
docker-compose restart backend
```

### Reconstruire les images
```bash
docker-compose up -d --build
```

### Supprimer les données (⚠️ efface la base de données)
```bash
docker-compose down -v
```

## Troubleshooting

### Les ports sont déjà utilisés
Modifiez les ports dans `docker-compose.yml` :
```yaml
ports:
  - "9001:8080"  # Au lieu de 9000:8080
```

### Le backend ne démarre pas
```bash
# Vérifier les logs
docker-compose logs backend

# Redémarrer le service
docker-compose restart backend
```

### Réinitialiser complètement
```bash
docker-compose down -v
docker-compose up -d --build
```

## Architecture

```
┌─────────────────┐
│   Frontend      │  Port 4200
│   (Angular)     │  Nginx
└────────┬────────┘
         │
         │ HTTP /api → proxy
         ↓
┌─────────────────┐
│   Backend       │  Port 9000
│   (Spring Boot) │  Java 17
└────────┬────────┘
         │
         │ JDBC
         ↓
┌─────────────────┐
│   PostgreSQL    │  Port 5433
│   Database      │
└─────────────────┘
```
