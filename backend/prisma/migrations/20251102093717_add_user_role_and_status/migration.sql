-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('ACTIVE', 'SUSPENDED');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "role" "Role" NOT NULL DEFAULT 'USER',
ADD COLUMN "status" "Status" NOT NULL DEFAULT 'ACTIVE';
