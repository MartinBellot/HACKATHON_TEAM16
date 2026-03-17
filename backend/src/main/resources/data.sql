-- Données de test pour le hackathon
-- Créer un utilisateur de démo
INSERT INTO users (username, password, email, role, created_at)
VALUES ('demo', '$2a$10$slYQmyNdGzTn7ZLBXBChFOC9f6kFjAqPhccnP6DxlWXx2lPk1C3G6', 'demo@capgemini.com', 'USER', CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

