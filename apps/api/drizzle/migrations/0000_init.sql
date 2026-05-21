CREATE TYPE "public"."user_role" AS ENUM('admin', 'client');
CREATE TYPE "public"."import_job_status" AS ENUM('queued', 'processing', 'completed', 'failed');
CREATE TYPE "public"."item_status" AS ENUM('critical', 'attention', 'adequate', 'excess');

CREATE TABLE "companies" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "slug" varchar(64) NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "companies_slug_unique" UNIQUE("slug")
);

CREATE TABLE "users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "clerk_user_id" varchar(128) NOT NULL,
  "email" text NOT NULL,
  "role" "user_role" NOT NULL,
  "company_id" uuid REFERENCES "companies"("id"),
  "created_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "users_clerk_user_id_unique" UNIQUE("clerk_user_id")
);

CREATE TABLE "import_jobs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "company_id" uuid NOT NULL REFERENCES "companies"("id"),
  "uploaded_by_user_id" uuid NOT NULL REFERENCES "users"("id"),
  "status" "import_job_status" NOT NULL,
  "original_filename" text NOT NULL,
  "r2_object_key" text NOT NULL,
  "row_count" integer,
  "error_code" varchar(64),
  "error_message" text,
  "is_active" boolean DEFAULT false NOT NULL,
  "queued_at" timestamptz DEFAULT now() NOT NULL,
  "started_at" timestamptz,
  "completed_at" timestamptz
);

CREATE UNIQUE INDEX "import_jobs_one_active_per_company" ON "import_jobs" ("company_id") WHERE "is_active" = true;

CREATE TABLE "stock_products" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "import_job_id" uuid NOT NULL REFERENCES "import_jobs"("id"),
  "company_id" uuid NOT NULL REFERENCES "companies"("id"),
  "product_name" text NOT NULL,
  "ean" varchar(32),
  "branches_with_stock" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "distribution" numeric(12, 4),
  "branches_with_demand" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "demand_vs_distribution" numeric(12, 4),
  "idd" numeric(12, 4),
  "stock" numeric(12, 4),
  "avg_demand" numeric(12, 4),
  "stock_days" numeric(12, 4),
  "item_status" "item_status" NOT NULL,
  "category" text DEFAULT 'Sem categoria' NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX "stock_products_company_import" ON "stock_products" ("company_id", "import_job_id");
CREATE INDEX "stock_products_company_status" ON "stock_products" ("company_id", "item_status");
