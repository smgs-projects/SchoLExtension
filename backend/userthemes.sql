CREATE TABLE `userthemes` (
  `code` varchar(64) NOT NULL,
  `theme` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`theme`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
ALTER TABLE `userthemes`
  ADD PRIMARY KEY (`code`);