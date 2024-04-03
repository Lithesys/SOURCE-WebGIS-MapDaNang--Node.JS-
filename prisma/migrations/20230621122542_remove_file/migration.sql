/*
  Warnings:

  - You are about to drop the column `fileId` on the `maplayer` table. All the data in the column will be lost.
  - You are about to drop the `file` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `maplayer` DROP FOREIGN KEY `MapLayer_fileId_fkey`;

-- AlterTable
ALTER TABLE `maplayer` DROP COLUMN `fileId`;

-- DropTable
DROP TABLE `file`;
