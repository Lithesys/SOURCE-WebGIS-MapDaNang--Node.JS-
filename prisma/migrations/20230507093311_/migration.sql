/*
  Warnings:

  - A unique constraint covering the columns `[title]` on the table `Location` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `description` to the `Location` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `location` ADD COLUMN `description` LONGTEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Location_title_key` ON `Location`(`title`);
