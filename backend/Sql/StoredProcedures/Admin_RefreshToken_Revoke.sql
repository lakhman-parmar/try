USE [dbRapidDevs]
GO
/****** Object:  StoredProcedure [dbo].[Admin_RefreshToken_Revoke]    Script Date: 21-05-2026 11:48:18 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
ALTER   PROCEDURE [dbo].[Admin_RefreshToken_Revoke]
    @RefreshTokenId INT
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE dbo.refresh_token
    SET is_revoked = 1
    WHERE refresh_token_id = @RefreshTokenId;
END
