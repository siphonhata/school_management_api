/*
  Warnings:

  - You are about to alter the column `class_number` on the `classroom` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `VarChar(10)`.
  - The `grade` column on the `classroom` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "classroom" ALTER COLUMN "class_number" SET DATA TYPE VARCHAR(10),
DROP COLUMN "grade",
ADD COLUMN     "grade" INTEGER;
