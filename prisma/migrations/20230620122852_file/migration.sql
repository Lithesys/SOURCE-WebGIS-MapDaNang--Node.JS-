/*
  Warnings:

  - A unique constraint covering the columns `[fileId]` on the table `MapLayer` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `maplayer` ADD COLUMN `fileId` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `File` (
    `id` VARCHAR(191) NOT NULL,
    `file_name` VARCHAR(191) NOT NULL,
    `path` VARCHAR(191) NOT NULL,
    `size` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `MapLayer_fileId_key` ON `MapLayer`(`fileId`);

-- AddForeignKey
ALTER TABLE `MapLayer` ADD CONSTRAINT `MapLayer_fileId_fkey` FOREIGN KEY (`fileId`) REFERENCES `File`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
