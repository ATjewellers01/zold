-- Seed default gold rate
-- Run with: psql -d your_database -f scripts/seed-gold-rate.sql

-- Deactivate existing rates
UPDATE "GoldRate" SET "isActive" = false WHERE "isActive" = true;

-- Insert default gold rate
INSERT INTO "GoldRate" (id, "buyRate", "sellRate", "isActive", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  6245.50,
  6145.50,
  true,
  NOW(),
  NOW()
);

-- Verify
SELECT * FROM "GoldRate" WHERE "isActive" = true;
