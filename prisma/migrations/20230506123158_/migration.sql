/*
  Warnings:

  - Made the column `url` on table `maplayer` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `maplayer` MODIFY `url` LONGTEXT NOT NULL;
