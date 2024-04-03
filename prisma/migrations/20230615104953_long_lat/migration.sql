/*
  Warnings:

  - You are about to drop the column `center` on the `mapview` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `mapview` DROP COLUMN `center`,
    ADD COLUMN `latitude` FLOAT NOT NULL DEFAULT 0,
    ADD COLUMN `longitude` FLOAT NOT NULL DEFAULT 0;
