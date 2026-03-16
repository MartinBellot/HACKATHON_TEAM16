# Règles de Commit

## Format des commits

Les commits doivent suivre la convention Conventional Commits :

```
<type>: <description courte>

<description détaillée optionnelle>
```

## Types de commits

- `feat:` Nouvelle fonctionnalité
- `fix:` Correction de bug
- `docs:` Documentation uniquement
- `style:` Formatage, points-virgules manquants, etc.
- `refactor:` Refactorisation du code
- `perf:` Amélioration des performances
- `test:` Ajout ou modification de tests
- `chore:` Modifications de la configuration, dépendances, etc.

## Exemples

```bash
feat: add carbon footprint calculation service
fix: resolve JWT token expiration issue
docs: update DOCKER.md with correct ports
refactor: simplify dashboard component logic
chore: update Spring Boot to 3.2.0
```

## Règles importantes

- ❌ **PAS de signature IA** dans les commits (pas de "Co-Authored-By: Claude" ou similaire)
- ✅ Messages concis et descriptifs
- ✅ En anglais de préférence
- ✅ Utiliser l'impératif ("add" et non "added")
- ✅ Première lettre en minuscule après le type
