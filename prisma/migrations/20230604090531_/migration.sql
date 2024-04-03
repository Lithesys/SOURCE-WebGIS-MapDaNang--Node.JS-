-- CreateIndex
CREATE FULLTEXT INDEX `Location_name_description_idx` ON `Location`(`name`, `description`);

-- CreateIndex
CREATE FULLTEXT INDEX `MapLayer_name_description_idx` ON `MapLayer`(`name`, `description`);

-- CreateIndex
CREATE FULLTEXT INDEX `User_name_email_idx` ON `User`(`name`, `email`);
