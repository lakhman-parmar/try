
CREATE OR ALTER PROCEDURE [dbo].[Admin_GetByEmail]
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
