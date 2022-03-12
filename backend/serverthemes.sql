-- phpMyAdmin SQL Dump
-- version 5.1.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Mar 12, 2022 at 08:33 AM
-- Server version: 10.4.22-MariaDB
-- PHP Version: 8.0.13

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `themes`
--

-- --------------------------------------------------------

--
-- Table structure for table `serverthemes`
--

CREATE TABLE `serverthemes` (
  `name` varchar(30) NOT NULL,
  `theme` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`theme`)),
  `creator` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `serverthemes`
--

INSERT INTO `serverthemes` (`name`, `theme`, `creator`) VALUES
('beach', '[\"rgb(0, 41, 107)\",\"rgb(0, 52, 122)\",\"rgb(0, 63, 136)\",\"rgb(0, 72, 147)\",\"rgb(0, 80, 157)\",\"rgb(253, 197, 0)\",\"rgb(254, 205, 0)\",\"rgb(255, 213, 0)\"]', 'Sebastien'),
('breen', '[\"rgb(120, 150, 181\",\"rgb(21, 58, 94\",\"rgb(3, 40, 77\",\"rgb(192, 218, 244\",\"rgb(171, 199, 226\",\"rgb(86, 118, 151\",\"rgb(186, 213, 239\",\"rgb(222, 235, 249\"]', 'Zac Mcwilliams'),
('fire', '[\"rgb(3, 7, 30)\",\"rgb(55, 6, 23)\",\"rgb(106, 4, 15)\",\"rgb(157, 2, 8)\",\"rgb(208, 0, 0)\",\"rgb(220, 47, 2)\",\"rgb(232, 93, 4)\",\"rgb(244, 140, 6)\",\"rgb(250, 163, 7)\",\"rgb(255, 186, 8)\"]', 'Sebastien'),
('hughes', '[\"rgb(255, 255, 255)\",\"rgb(143, 62, 55)\",\"rgb(117, 6, 0)\",\"rgb(118, 7, 0)\",\"rgb(255, 255, 255)\",\"rgb(120, 12, 5)\"]', 'Sebastien'),
('italy', '[\"rgb(230, 57, 70)\", \"rgb(236, 154, 154)\", \"rgb(239, 202, 196)\", \"rgb(241, 250, 238)\", \"rgb(168, 218, 220)\", \"rgb(144, 195, 205)\", \"rgb(119, 171, 189)\", \"rgb(69, 123, 157)\", \"rgb(49, 88, a122)\", \"rgb(29, 53,87)\"]', 'Sebastien'),
('kilburn', '[\"rgb(26, 149, 89)\",\"rgb(243, 248, 245)\",\"rgb(26, 149, 89)\",\"rgb(129, 192, 156)\",\"rgb(24, 148, 88)\"]', 'Sebastien'),
('lemon lime ', '[\"rgb(0, 127, 95)\",\"rgb(43, 147, 72)\",\"rgb(85, 166, 48)\",\"rgb(128, 185, 24)\",\"rgb(170, 204, 0)\",\"rgb(191, 210, 0)\",\"rgb(212, 215, 0)\",\"rgb(221, 223, 0)\",\"rgb(238, 239, 32)\",\"rgb(255, 255, 63)\"]', 'Sebastien'),
('mitre', '[\"rgb(109, 141, 173)\", \"rgb(161, 190, 219)\",\"rgb(192, 218, 243)\",\"rgb(191, 218, 242)\",\"rgb(35, 71, 107)\",\"rgb(183, 211, 237)\",\"rgb(24, 61, 98)\"]\r\n', 'Sebastien'),
('ocean', '[\"rgb(3, 4, 94)\", \"rgb(2, 62, 138)\", \"rgb(0, 119, 182)\", \"rgb(0, 150, 199)\", \"rgb(0, 180, 216)\", \"rgb(72, 202, 228)\", \"rgb(144, 224, 239)\", \"rgb(173, 232, 244)\", \"rgb(202, 240, 248)\"]', 'Sebastien'),
('pastel', '[\"rgb(255, 224, 204)\",\"rgb(204, 255, 204)\",\"rgb(204, 204, 255)\",\"rgb(255, 204, 245)\",\"rgb(255, 245, 204)\",\"rgb(221, 221, 153)\",\"rgb(255, 224, 204)\",\"rgb(204, 255, 204)\",\"rgb(204, 224, 255)\",\"rgb(197, 198, 200)\",\"rgb(245, 255, 204)\",\"rgb(255, 153, 153)\"]', 'null'),
('sarum', '[\"rgb(246, 217, 2)\",\"rgb(236, 205, 3)\",\"rgb(246, 218, 0)\",\"rgb(104, 66)\",\"rgb(251, 237, 150)\",\"rgb(188, 153, 6)\"]', 'Sebastien'),
('zac', '[\"rgb(219, 219, 255)\",\"rgb(229, 253, 255)\",\"rgb(255, 219, 248)\",\"rgb(224, 237, 255)\",\"rgb(255, 224, 224)\",\"rgb(224, 255, 224)\",\"rgb(255, 248, 219)\",\"rgb(255, 234, 219)\",\"rgb(249, 255, 224)\",\"rgb(219, 214, 255)\"]', 'Sebastien');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `serverthemes`
--
ALTER TABLE `serverthemes`
  ADD PRIMARY KEY (`name`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
