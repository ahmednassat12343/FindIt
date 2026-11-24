-- FindIt67 Database Schema (SQL Server)
-- Covers Jira tasks: CMM-46 (Users), CMM-62 (Reports & Images), CMM-59 (Claims)

IF DB_ID(N'FindItDb') IS NULL
BEGIN
    CREATE DATABASE FindItDb;
END;
GO

USE FindItDb;
GO

-- 1. Users (CMM-46)
CREATE TABLE dbo.Users (
    UserID       INT IDENTITY(1,1) PRIMARY KEY,
    Name         NVARCHAR(120)  NOT NULL,
    Email        NVARCHAR(256)  NOT NULL UNIQUE,
    PasswordHash NVARCHAR(512)  NOT NULL,
    Role         NVARCHAR(20)   NOT NULL CONSTRAINT DF_Users_Role DEFAULT N'User',
    CreatedAt    DATETIME2      NOT NULL CONSTRAINT DF_Users_CreatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT CK_Users_Role CHECK (Role IN (N'User', N'Moderator', N'Admin'))
);
GO

-- 2. Items (CMM-62)
CREATE TABLE dbo.Items (
    ItemID    INT IDENTITY(1,1) PRIMARY KEY,
    ItemName  NVARCHAR(150) NOT NULL,
    Category  NVARCHAR(80)  NOT NULL,
    Color     NVARCHAR(50)  NOT NULL
);
GO

-- 3. Reports (CMM-62, CMM-43)
CREATE TABLE dbo.Reports (
    ReportID             INT IDENTITY(1,1) PRIMARY KEY,
    ReferenceCode        NVARCHAR(32)   NOT NULL UNIQUE,
    UserID               INT            NOT NULL,
    ItemID               INT            NOT NULL,
    ReportType           NVARCHAR(10)   NOT NULL,
    Location             NVARCHAR(200)  NOT NULL,
    ReportDate           DATETIME2      NOT NULL,
    Description          NVARCHAR(1000) NOT NULL,
    VerificationQuestion NVARCHAR(300)  NULL,
    HiddenDetails        NVARCHAR(500)  NULL,
    Status               NVARCHAR(20)   NOT NULL CONSTRAINT DF_Reports_Status DEFAULT N'Open',
    CreatedAt            DATETIME2      NOT NULL CONSTRAINT DF_Reports_CreatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_Reports_Users FOREIGN KEY (UserID) REFERENCES dbo.Users(UserID),
    CONSTRAINT FK_Reports_Items FOREIGN KEY (ItemID) REFERENCES dbo.Items(ItemID),
    CONSTRAINT CK_Reports_Type CHECK (ReportType IN (N'Lost', N'Found')),
    CONSTRAINT CK_Reports_Status CHECK (Status IN (N'Open', N'Matched', N'Claimed', N'Recovered', N'Removed'))
);
GO

CREATE INDEX IX_Reports_Type_Status ON dbo.Reports (ReportType, Status) INCLUDE (Location, ReportDate);
CREATE INDEX IX_Items_Category_Color ON dbo.Items (Category, Color);
GO

-- 4. Images (CMM-62, CMM-66)
CREATE TABLE dbo.Images (
    ImageID    INT IDENTITY(1,1) PRIMARY KEY,
    ReportID   INT           NOT NULL,
    ImagePath  NVARCHAR(500) NOT NULL,
    UploadedAt DATETIME2     NOT NULL CONSTRAINT DF_Images_UploadedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_Images_Reports FOREIGN KEY (ReportID) REFERENCES dbo.Reports(ReportID) ON DELETE CASCADE
);
GO

-- 5. Claims (CMM-59, CMM-60, CMM-61)
CREATE TABLE dbo.Claims (
    ClaimID            INT IDENTITY(1,1) PRIMARY KEY,
    ReportID           INT            NOT NULL,
    UserID             INT            NOT NULL,
    VerificationAnswer NVARCHAR(500)  NOT NULL,
    ClaimStatus        NVARCHAR(20)   NOT NULL CONSTRAINT DF_Claims_Status DEFAULT N'Pending',
    AdminNote          NVARCHAR(500)  NULL,
    SubmittedAt        DATETIME2      NOT NULL CONSTRAINT DF_Claims_SubmittedAt DEFAULT SYSUTCDATETIME(),
    ReviewedAt         DATETIME2      NULL,
    CONSTRAINT FK_Claims_Reports FOREIGN KEY (ReportID) REFERENCES dbo.Reports(ReportID),
    CONSTRAINT FK_Claims_Users FOREIGN KEY (UserID) REFERENCES dbo.Users(UserID),
    CONSTRAINT CK_Claims_Status CHECK (ClaimStatus IN (N'Pending', N'Approved', N'Rejected'))
);
GO

-- 6. Notifications (CMM-38, CMM-71)
CREATE TABLE dbo.Notifications (
    NotificationID INT IDENTITY(1,1) PRIMARY KEY,
    UserID         INT           NOT NULL,
    Message        NVARCHAR(500) NOT NULL,
    IsRead         BIT           NOT NULL CONSTRAINT DF_Notifications_IsRead DEFAULT 0,
    CreatedAt      DATETIME2     NOT NULL CONSTRAINT DF_Notifications_CreatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_Notifications_Users FOREIGN KEY (UserID) REFERENCES dbo.Users(UserID)
);
GO

-- 7. Messages (CMM-41, CMM-72)
CREATE TABLE dbo.Messages (
    MessageID  INT IDENTITY(1,1) PRIMARY KEY,
    ReportID   INT            NOT NULL,
    SenderID   INT            NOT NULL,
    ReceiverID INT            NOT NULL,
    Content    NVARCHAR(1000) NOT NULL,
    SentAt     DATETIME2      NOT NULL CONSTRAINT DF_Messages_SentAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_Messages_Reports FOREIGN KEY (ReportID) REFERENCES dbo.Reports(ReportID),
    CONSTRAINT FK_Messages_Sender FOREIGN KEY (SenderID) REFERENCES dbo.Users(UserID),
    CONSTRAINT FK_Messages_Receiver FOREIGN KEY (ReceiverID) REFERENCES dbo.Users(UserID)
);
GO
