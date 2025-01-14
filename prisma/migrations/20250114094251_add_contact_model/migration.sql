/*
  Warnings:

  - Added the required column `subject` to the `contacts` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "contacts" ADD COLUMN     "subject" TEXT NOT NULL;
