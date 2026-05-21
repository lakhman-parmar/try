USE [dbRapidDevs]
GO
/****** Object:  StoredProcedure [dbo].[Admin_RefreshToken_Create]    Script Date: 21-05-2026 11:47:25 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

ALTER PROCEDURE [dbo].[Admin_RefreshToken_Create]
    @AdminId INT,
    @TokenHash NVARCHAR(256),
    @IsRevoked BIT,
    @CreatedAt DATETIME2,
    @ExpiredAt DATETIME2
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO dbo.refresh_token
    (
        admin_id,
        token_hash,
        is_revoked,
        created_at,
        expired_at
    )
    VALUES
    (
        @AdminId,
        @TokenHash,
        @IsRevoked,
        @CreatedAt,
        @ExpiredAt
    );
END
