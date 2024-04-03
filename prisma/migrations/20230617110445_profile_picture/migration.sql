/*
  Warnings:

  - You are about to drop the column `pciture` on the `profile` table. All the data in the column will be lost.
  - Added the required column `picture` to the `Profile` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `profile` DROP COLUMN `pciture`,
    ADD COLUMN `picture` LONGTEXT NOT NULL;

-- CreateIndex
CREATE FULLTEXT INDEX `User_email_password_idx` ON `User`(`email`, `password`);
