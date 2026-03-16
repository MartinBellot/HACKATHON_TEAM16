-- Données de test pour le hackathon
-- Créer un utilisateur de démo
INSERT INTO users (username, password, email, role, created_at)
VALUES ('demo', '$2a$10$slYQmyNdGzTn7ZLBXBChFOC9f6kFjAqPhccnP6DxlWXx2lPk1C3G6', 'demo@capgemini.com', 'USER', CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

-- Site exemple : Campus Capgemini Rennes
-- (Les calculs seront automatiquement effectués par l'application)
INSERT INTO sites (
    name,
    location,
    total_surface,
    parking_places,
    underground_parking,
    ground_parking,
    aerial_parking,
    energy_consumption,
    employees,
    workstations,
    concrete_quantity,
    steel_quantity,
    glass_quantity,
    wood_quantity,
    user_id,
    created_at,
    updated_at
)
SELECT
    'Campus Capgemini Rennes',
    'Rennes, France',
    11771.0,
    308,
    41,
    184,
    83,
    1840.0,
    1800,
    1037,
    500.0,
    100.0,
    50.0,
    20.0,
    u.id,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM users u
WHERE u.username = 'demo'
ON CONFLICT DO NOTHING;
