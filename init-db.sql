-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de registros de peso
CREATE TABLE IF NOT EXISTS weight_records (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    weight DECIMAL(5,2) NOT NULL,
    date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de metas
CREATE TABLE IF NOT EXISTS goals (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    target_weight DECIMAL(5,2) NOT NULL,
    target_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX idx_weight_records_user_id ON weight_records(user_id);
CREATE INDEX idx_weight_records_date ON weight_records(date);
CREATE INDEX idx_goals_user_id ON goals(user_id);

-- Datos de ejemplo
INSERT INTO users (username, email, password_hash) VALUES 
('testuser', 'test@example.com', '$2a$10$example.hash.here');

INSERT INTO weight_records (user_id, weight, date, notes) VALUES 
(1, 75.5, '2024-01-01', 'Peso inicial'),
(1, 74.8, '2024-01-08', 'Primera semana'),
(1, 74.2, '2024-01-15', 'Progreso constante');
