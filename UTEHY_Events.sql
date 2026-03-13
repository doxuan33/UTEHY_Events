-- 1. Tạo Database hỗ trợ tiếng Việt (utf8mb4)
CREATE DATABASE IF NOT EXISTS utehy_events 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE utehy_events;

-- ==========================================
-- BẢNG ĐỘC LẬP (Không phụ thuộc khóa ngoại)
-- ==========================================

-- 2. Bảng Users (Người dùng)
CREATE TABLE Users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(20) UNIQUE, -- MSSV là duy nhất
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    class_name VARCHAR(50),
    avatar_url VARCHAR(500),
    total_points INT DEFAULT 0,
    role ENUM('STUDENT', 'PAGE_ADMIN', 'SYS_ADMIN') DEFAULT 'STUDENT',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 3. Bảng Event_Categories (Danh mục Sự kiện)
CREATE TABLE Event_Categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(500) NOT NULL,
    default_points INT DEFAULT 0
);

-- 4. Bảng Badges (Huy hiệu)
CREATE TABLE Badges (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    icon_url VARCHAR(500),
    condition_description TEXT
);

-- ==========================================
-- BẢNG PHỤ THUỘC (Có khóa ngoại)
-- ==========================================

-- 5. Bảng Clubs (Câu lạc bộ)
CREATE TABLE Clubs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    logo_url VARCHAR(500),
    cover_url VARCHAR(500),
    admin_user_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_user_id) REFERENCES Users(id) ON DELETE SET NULL
);

-- 6. Bảng User_Badges (Huy hiệu của Sinh viên)
CREATE TABLE User_Badges (
    user_id INT,
    badge_id INT,
    achieved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, badge_id), -- Một SV chỉ nhận 1 loại huy hiệu 1 lần
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (badge_id) REFERENCES Badges(id) ON DELETE CASCADE
);

-- 7. Bảng Events (Sự kiện)
CREATE TABLE Events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    club_id INT NOT NULL,
    category_id INT,
    name VARCHAR(500) NOT NULL,
    description TEXT,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    max_slots INT DEFAULT 0,
    points INT DEFAULT 0,
    registration_deadline DATETIME,
    location_name VARCHAR(255),
    lat DECIMAL(10, 8), -- Vĩ độ (Chuẩn lưu GPS của Google Maps)
    lng DECIMAL(11, 8), -- Kinh độ
    current_participants INT DEFAULT 0,
    status ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (club_id) REFERENCES Clubs(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES Event_Categories(id) ON DELETE SET NULL
);

-- 8. Bảng Registrations (Đăng ký)
CREATE TABLE Registrations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL,
    user_id INT NOT NULL,
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    checkin_at DATETIME NULL,
    status ENUM('REGISTERED', 'ATTENDED', 'ABSENT', 'CANCELLED') DEFAULT 'REGISTERED',
    FOREIGN KEY (event_id) REFERENCES Events(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_event (user_id, event_id) -- Chống spam: 1 SV chỉ được đăng ký 1 sự kiện 1 lần
);

-- 9. Bảng Posts (Bài viết mạng xã hội)
CREATE TABLE Posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    club_id INT NOT NULL,
    content TEXT NOT NULL,
    image_url VARCHAR(500),
    like_count INT DEFAULT 0,
    comment_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (club_id) REFERENCES Clubs(id) ON DELETE CASCADE
);

-- 10. Bảng Comments (Bình luận - Bổ sung để MXH hoạt động)
CREATE TABLE Comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    post_id INT NOT NULL,
    user_id INT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES Posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);

-- 11. Bảng Likes (Lượt thích - Bổ sung để MXH hoạt động)
CREATE TABLE Likes (
    post_id INT NOT NULL,
    user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (post_id, user_id), -- 1 SV chỉ like 1 bài 1 lần
    FOREIGN KEY (post_id) REFERENCES Posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);