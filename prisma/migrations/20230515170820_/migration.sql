/*
  Warnings:

  - You are about to drop the column `title` on the `location` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `maplayer` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name]` on the table `Location` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `name` to the `Location` table without a default value. This is not possible if the table is not empty.
  - Added the required column `workspace` to the `Location` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `MapLayer` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `Location_title_key` ON `location`;

-- AlterTable
ALTER TABLE `location` CHANGE `title` `name` VARCHAR(191) NOT NULL;
-- AlterTable
ALTER TABLE `location` ADD COLUMN `workspace` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `maplayer` CHANGE `title` `name` VARCHAR(191) NOT NULL;
