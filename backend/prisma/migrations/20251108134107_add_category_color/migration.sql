/*
  Warnings:

  - The values [TRANSFER] on the enum `CategoryType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "CategoryType_new" AS ENUM ('INCOME', 'EXPENSE');
ALTER TABLE "Category" ALTER COLUMN "type" TYPE "CategoryType_new" USING ("type"::text::"CategoryType_new");
ALTER TYPE "CategoryType" RENAME TO "CategoryType_old";
ALTER TYPE "CategoryType_new" RENAME TO "CategoryType";
DROP TYPE "CategoryType_old";
COMMIT;

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "color" TEXT;

-- CreateIndex
CREATE INDEX "Category_type_idx" ON "Category"("type");
