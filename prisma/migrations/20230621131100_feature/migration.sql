-- CreateTable
CREATE TABLE `Feature` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `properties` LONGTEXT NULL,
    `layerId` INTEGER NULL,

    UNIQUE INDEX `Feature_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Feature` ADD CONSTRAINT `Feature_layerId_fkey` FOREIGN KEY (`layerId`) REFERENCES `MapLayer`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
