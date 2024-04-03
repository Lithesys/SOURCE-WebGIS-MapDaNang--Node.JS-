-- DropForeignKey
ALTER TABLE `feature` DROP FOREIGN KEY `Feature_layerId_fkey`;

-- DropForeignKey
ALTER TABLE `maplayer` DROP FOREIGN KEY `MapLayer_locationId_fkey`;

-- DropForeignKey
ALTER TABLE `mapview` DROP FOREIGN KEY `MapView_locationId_fkey`;

-- AddForeignKey
ALTER TABLE `MapView` ADD CONSTRAINT `MapView_locationId_fkey` FOREIGN KEY (`locationId`) REFERENCES `Location`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MapLayer` ADD CONSTRAINT `MapLayer_locationId_fkey` FOREIGN KEY (`locationId`) REFERENCES `Location`(`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Feature` ADD CONSTRAINT `Feature_layerId_fkey` FOREIGN KEY (`layerId`) REFERENCES `MapLayer`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
