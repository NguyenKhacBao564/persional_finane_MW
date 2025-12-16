/*
  Warnings:

  - You are about to drop the column `amount` on the `Budget` table. All the data in the column will be lost.
  - You are about to drop the column `period` on the `Budget` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,categoryId,month]` on the table `Budget` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `limit` to the `Budget` table without a default value. This is not possible if the table is not empty.
  - Added the required column `month` to the `Budget` table without a default value. This is not possible if the table is not empty.
  - Made the column `categoryId` on table `Budget` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Budget" DROP CONSTRAINT "Budget_categoryId_fkey";

-- AlterTable
ALTER TABLE "Budget" DROP COLUMN "amount",
DROP COLUMN "period",
ADD COLUMN     "limit" DECIMAL(14,2) NOT NULL,
ADD COLUMN     "month" TEXT NOT NULL,
ALTER COLUMN "categoryId" SET NOT NULL;

-- DropEnum
DROP TYPE "BudgetPeriod";

-- CreateIndex
CREATE INDEX "Budget_userId_month_idx" ON "Budget"("userId", "month");

-- CreateIndex
CREATE UNIQUE INDEX "Budget_userId_categoryId_month_key" ON "Budget"("userId", "categoryId", "month");

-- AddForeignKey
ALTER TABLE "Budget" ADD CONSTRAINT "Budget_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
