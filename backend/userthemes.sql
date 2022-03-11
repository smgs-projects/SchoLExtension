-- phpMyAdmin SQL Dump
-- version 5.1.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Mar 11, 2022 at 04:45 AM
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
-- Table structure for table `userthemes`
--

CREATE TABLE `userthemes` (
  `code` varchar(200) NOT NULL,
  `theme` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`theme`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `userthemes`
--

INSERT INTO `userthemes` (`code`, `theme`) VALUES
('Hotel-Foxtrot-X-ray-261-942', '{\"11PS-SUPSH02\":\"rgb(255, 224, 204)\",\"11SC-CHEMI03\":\"rgb(204, 255, 204)\",\"11TE-COMPU01\":\"rgb(204, 224, 255)\",\"11MA-MATHM01\":\"rgb(255, 204, 245)\",\"11EN-ELANG02\":\"rgb(255, 245, 204)\",\"11HU-LEGAL02\":\"rgb(197, 198, 200)\",\"12SC-BIOLO02\":\"rgb(204, 204, 255)\",\"11HH-HOUSE02\":\"rgb(221, 221, 153)\",\"SEN-ROBOTICS\":\"rgb(245, 255, 204)\",\"SS-SPORT01\":\"rgb(255, 153, 153)\"}'),
('Quebec-Yankee-Golf-361-790', '{\"11PS-SUPSH02\":\"rgb(0, 0, 0)\",\"11SC-CHEMI03\":\"rgb(204, 255, 204)\",\"11TE-COMPU01\":\"rgb(204, 224, 255)\",\"11MA-MATHM01\":\"rgb(255, 204, 245)\",\"11EN-ELANG02\":\"rgb(255, 245, 204)\",\"11HU-LEGAL02\":\"rgb(197, 198, 200)\",\"12SC-BIOLO02\":\"rgb(204, 204, 255)\",\"11HH-HOUSE02\":\"rgb(221, 221, 153)\",\"SEN-ROBOTICS\":\"rgb(245, 255, 204)\",\"SS-SPORT01\":\"rgb(255, 153, 153)\"}'),
('Victor-Whiskey-Sierra-417-115', '{\"0\":\"{\",\"1\":\"}\",\"11PS-SUPSH02\":\"rgb(0, 0, 0)\"}');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `userthemes`
--
ALTER TABLE `userthemes`
  ADD PRIMARY KEY (`code`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
