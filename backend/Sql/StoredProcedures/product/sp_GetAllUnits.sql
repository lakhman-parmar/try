CREATE OR ALTER PROCEDURE [dbo].[sp_GetAllUnits]
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        unit_id    AS UnitId,
        name       AS Name,
        short_name AS ShortName
    FROM [unit]
    WHERE is_deleted = 0
    ORDER BY name;
END;
GO
