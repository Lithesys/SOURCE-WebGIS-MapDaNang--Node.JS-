/*
  Warnings:

  - You are about to drop the column `family_name` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `given_name` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `sub` on the `user` table. All the data in the column will be lost.
  - Added the required column `password` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `User_name_email_idx` ON `user`;

-- DropIndex
DROP INDEX `User_sub_key` ON `user`;

-- AlterTable
ALTER TABLE `user` DROP COLUMN `family_name`,
    DROP COLUMN `given_name`,
    DROP COLUMN `name`,
    DROP COLUMN `sub`,
    ADD COLUMN `password` VARCHAR(32) NOT NULL;

-- CreateTable
CREATE TABLE `Profile` (
    `id` VARCHAR(191) NOT NULL,
    `sub` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `given_name` VARCHAR(191) NULL,
    `family_name` VARCHAR(191) NULL,
    `pciture` LONGTEXT NOT NULL,
    `userId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Profile_sub_key`(`sub`),
    UNIQUE INDEX `Profile_email_key`(`email`),
    UNIQUE INDEX `Profile_userId_key`(`userId`),
    FULLTEXT INDEX `Profile_name_email_idx`(`name`, `email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE FULLTEXT INDEX `User_email_idx` ON `User`(`email`);

-- AddForeignKey
ALTER TABLE `Profile` ADD CONSTRAINT `Profile_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
