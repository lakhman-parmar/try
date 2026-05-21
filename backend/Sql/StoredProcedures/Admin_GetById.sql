USE [dbRapidDevs]
GO
/****** Object:  StoredProcedure [dbo].[Admin_GetById]    Script Date: 21-05-2026 11:46:57 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
ALTER PROCEDURE [dbo].[Admin_GetById]
    @AdminId INT
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
    WHERE admin_id = @AdminId;
END
