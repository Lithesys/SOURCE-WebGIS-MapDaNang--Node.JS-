/*
  Warnings:

  - You are about to drop the column `latitude` on the `location` table. All the data in the column will be lost.
  - You are about to drop the column `longitude` on the `location` table. All the data in the column will be lost.
  - You are about to drop the column `projectionId` on the `location` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `location` DROP FOREIGN KEY `Location_projectionId_fkey`;

-- AlterTable
ALTER TABLE `location` DROP COLUMN `latitude`,
    DROP COLUMN `longitude`,
    DROP COLUMN `projectionId`;

-- CreateTable
CREATE TABLE `MapView` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `projectionId` INTEGER NULL,
    `zoom` FLOAT NOT NULL DEFAULT 10,
    `maxZoom` FLOAT NOT NULL DEFAULT 18,
    `center` LONGTEXT NOT NULL,
    `extent` LONGTEXT NOT NULL,
    `locationId` INTEGER NOT NULL,

    UNIQUE INDEX `MapView_locationId_key`(`locationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `MapView` ADD CONSTRAINT `MapView_projectionId_fkey` FOREIGN KEY (`projectionId`) REFERENCES `Projection`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MapView` ADD CONSTRAINT `MapView_locationId_fkey` FOREIGN KEY (`locationId`) REFERENCES `Location`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
