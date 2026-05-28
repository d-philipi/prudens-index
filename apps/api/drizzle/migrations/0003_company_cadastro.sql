ALTER TABLE companies ADD COLUMN IF NOT EXISTS cnpj text;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS neighborhood text;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS state char(2);

CREATE UNIQUE INDEX IF NOT EXISTS companies_cnpj_unique
  ON companies (cnpj) WHERE cnpj IS NOT NULL;
