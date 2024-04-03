-- AlterTable
ALTER TABLE `location` ADD COLUMN `projectionId` INTEGER NULL;

-- CreateTable
CREATE TABLE `Projection` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `definition` LONGTEXT NOT NULL,

    UNIQUE INDEX `Projection_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Location` ADD CONSTRAINT `Location_projectionId_fkey` FOREIGN KEY (`projectionId`) REFERENCES `Projection`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
