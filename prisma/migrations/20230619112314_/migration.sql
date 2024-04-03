-- AlterTable
ALTER TABLE `profile` MODIFY `birthday` DATETIME(3) NULL,
    MODIFY `gender` ENUM('MALE', 'FEMALE', 'OTHER') NULL;
