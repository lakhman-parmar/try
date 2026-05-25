USE [dbRapidDevs]
GO
/****** Object:  StoredProcedure [dbo].[Admin_RefreshToken_RevokeByHash]    Script Date: 21-05-2026 11:48:41 AM ******/
CREATE OR
ALTER   PROCEDURE [dbo].[Admin_RefreshToken_RevokeByHash]
    @TokenHash NVARCHAR(256)
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE dbo.refresh_token
    SET is_revoked = 1
    WHERE token_hash = @TokenHash
      AND is_revoked = 0;
END
