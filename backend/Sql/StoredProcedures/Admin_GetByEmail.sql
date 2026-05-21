USE [dbRapidDevs]
GO
/****** Object:  StoredProcedure [dbo].[Admin_GetByEmail]    Script Date: 21-05-2026 11:46:12 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
ALTER PROCEDURE [dbo].[Admin_GetByEmail]
    @Email NVARCHAR(256)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        admin_id,
        Name,
        Email,
        password_hash,
        created_at,
        modified_at
    FROM dbo.Admin
    WHERE Email = @Email;
END
