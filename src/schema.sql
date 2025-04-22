-- Schema for PostgreSQL

-- Base entity table for organizations
CREATE TABLE IF NOT EXISTS "organization" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
  "name" VARCHAR(255) NOT NULL UNIQUE,
  "logo_url" VARCHAR(255),
  "farm_type" VARCHAR(50) NOT NULL
);

-- Base entity for users
CREATE TABLE IF NOT EXISTS "user" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
  "email" VARCHAR(255) NOT NULL UNIQUE,
  "name" VARCHAR(255) NOT NULL,
  "organization_id" UUID NOT NULL,
  FOREIGN KEY ("organization_id") REFERENCES "organization" ("id") ON DELETE CASCADE
);

-- Tenant tables (for each tenant database)
-- These tables are created in each tenant DB

-- Crop table
CREATE TABLE IF NOT EXISTS "crop" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
  "name" VARCHAR(255) NOT NULL,
  "planting_date" DATE NOT NULL,
  "organization_id" UUID NOT NULL
);

-- Harvest table
CREATE TABLE IF NOT EXISTS "harvest" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
  "quantity" NUMERIC NOT NULL,
  "unit" VARCHAR(50) NOT NULL,
  "crop_id" UUID NOT NULL,
  "organization_id" UUID NOT NULL,
  FOREIGN KEY ("crop_id") REFERENCES "crop" ("id") ON DELETE CASCADE
); 