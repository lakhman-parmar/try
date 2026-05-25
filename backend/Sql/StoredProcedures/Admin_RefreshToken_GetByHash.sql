USE [dbRapidDevs]
GO
/****** Object:  StoredProcedure [dbo].[Admin_RefreshToken_GetByHash]    Script Date: 21-05-2026 11:47:52 AM ******/

CREATE OR ALTER   PROCEDURE [dbo].[Admin_RefreshToken_GetByHash]
    @TokenHash NVARCHAR(256)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
       refresh_token_id,
        admin_id,
        token_hash,
        is_revoked,
        created_at,
        expired_at
    FROM dbo.refresh_token
    WHERE token_hash = @TokenHash;
END
