-- AlterTable
ALTER TABLE `feature` ADD COLUMN `type` ENUM('EXTERNAL', 'INTERNAL') NOT NULL DEFAULT 'INTERNAL';
