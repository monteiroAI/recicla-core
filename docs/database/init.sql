-- ============================================================================
-- SCRIPT DE RECONSTRUÇÃO DO BANCO DE DADOS "RECICLA" (POSTGRESQL)
-- AMBIENTE: ADMINER / FILOSOFIA: SQL PURO E CONTROLE NATIVO
-- ============================================================================

-- 0. ATIVAÇÃO DE EXTENSÕES NATIVAS (Para geração automática de UUID)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 👤 DOMÍNIO I: PERFIS, ATORES E IDENTIDADE (CORE ID)
-- ============================================================================

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    bairro VARCHAR(100) NOT NULL,
    municipio VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL, -- 'admin', 'driver', 'auditor', 'operator', 'corporate_client', 'keeper'
    description TEXT
);

CREATE TABLE IF NOT EXISTS user_roles (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- ============================================================================
-- 🏢 DOMÍNIO II: ENTIDADES OPERACIONAIS E MATÉRIA-SECUNDA (CORE LOGISTICS)
-- ============================================================================

CREATE TABLE IF NOT EXISTS entities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cnpj VARCHAR(14) UNIQUE NOT NULL,
    corporate_name VARCHAR(255) NOT NULL,
    trade_name VARCHAR(255),
    type VARCHAR(50) NOT NULL, -- 'generator', 'cooperative', 'destination'
    address_street VARCHAR(255),
    address_number VARCHAR(20),
    latitude NUMERIC(10,8),
    longitude NUMERIC(11,8)
);

CREATE TABLE IF NOT EXISTS materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL, -- 'PET_01', 'ALUM_GP', 'ORGANIC_01'
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'plastic', 'metal', 'paper', 'glass', 'organic'
    unit_of_measure VARCHAR(10) DEFAULT 'KG'
);

CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    material_id UUID NOT NULL REFERENCES materials(id),
    name VARCHAR(150) NOT NULL,
    sku VARCHAR(100) UNIQUE NOT NULL,
    stock_quantity NUMERIC(12,3) DEFAULT 0.000
);

-- ============================================================================
-- 📜 DOMÍNIO III: CAPTURA DOCUMENTAL E EVIDÊNCIAS DE ENTRADA (mrvCORP B2B)
-- ============================================================================

CREATE TABLE IF NOT EXISTS corporate_service_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    generator_id UUID NOT NULL REFERENCES entities(id),
    order_number VARCHAR(100) UNIQUE NOT NULL,
    scheduled_date TIMESTAMP NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' -- 'pending', 'in_transit', 'completed', 'cancelled'
);

CREATE TABLE IF NOT EXISTS corporate_fiscal_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_order_id UUID NOT NULL REFERENCES corporate_service_orders(id),
    document_type VARCHAR(20) NOT NULL, -- 'NFE', 'MTRE'
    access_key VARCHAR(44) UNIQUE NOT NULL,
    declared_weight NUMERIC(12,3) NOT NULL
);

CREATE TABLE IF NOT EXISTS corporate_entity_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_id UUID NOT NULL REFERENCES entities(id),
    api_key_hash VARCHAR(255) NOT NULL,
    endpoint_url VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE
);

-- ============================================================================
-- 🚀 DOMÍNIO IV: EXECUÇÃO EM TEMPO REAL E TELEMETRIA DE CAMPO (CORE RUNTIME)
-- ============================================================================

CREATE TABLE IF NOT EXISTS corporate_missions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_order_id UUID NOT NULL REFERENCES corporate_service_orders(id),
    current_compliance_status VARCHAR(30) NOT NULL DEFAULT 'Em Verificação', -- 'Atendido', 'Em Verificação', 'Suspeito', 'Rejeitado'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS corporate_mission_trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mission_id UUID NOT NULL REFERENCES corporate_missions(id) ON DELETE CASCADE,
    latitude NUMERIC(10,8) NOT NULL,
    longitude NUMERIC(11,8) NOT NULL,
    speed NUMERIC(5,2),
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Índices de Performance do Domínio IV
CREATE INDEX IF NOT EXISTS idx_trips_mission ON corporate_mission_trips(mission_id);

CREATE TABLE IF NOT EXISTS corporate_mission_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mission_id UUID NOT NULL REFERENCES corporate_missions(id) ON DELETE CASCADE,
    evidence_type VARCHAR(50) NOT NULL, -- 'scale_photo', 'signature', 'raw_payload'
    file_hash VARCHAR(64) NOT NULL, -- Hash SHA-256 do arquivo físico
    meta_data JSONB -- Payload do GPS e metadados EXIF da foto da balança
);

-- ============================================================================
-- 🪙 DOMÍNIO V: CRÉDITOS CLIMÁTICOS, MICROPAGAMENTOS E AUDITORIA FORENSE (PMGIRS)
-- ============================================================================

CREATE TABLE IF NOT EXISTS distribution_matrices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operation_code VARCHAR(100) NOT NULL,
    recipient_type VARCHAR(50) NOT NULL,
    fractional_delta NUMERIC(12,3) NOT NULL,
    payout_rate NUMERIC(10,2) NOT NULL,
    CONSTRAINT unique_operation_recipient UNIQUE (operation_code, recipient_type)
);

-- Índices de Performance do Domínio V
CREATE INDEX IF NOT EXISTS idx_matrix_operation ON distribution_matrices(operation_code);

CREATE TABLE IF NOT EXISTS material_co2_factors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    material_id UUID NOT NULL REFERENCES materials(id),
    factor NUMERIC(8,4) NOT NULL, -- kg resíduo -> CO2e
    source_protocol VARCHAR(100) DEFAULT 'GHG Protocol 2026'
);

CREATE TABLE IF NOT EXISTS national_gravimetries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    region VARCHAR(50) NOT NULL,
    material_category VARCHAR(50) NOT NULL,
    percentage NUMERIC(5,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS auditor_activity_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    target_table VARCHAR(50) NOT NULL,
    previous_state JSONB,
    new_state JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);