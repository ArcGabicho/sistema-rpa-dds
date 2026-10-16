namespace Server.Services;

// DDS works on Lima time. Peru is UTC-5 all year (no daylight saving since
// 1994), so a fixed offset avoids depending on the container's tz database.
public static class Lima
{
    private static readonly TimeSpan Offset = TimeSpan.FromHours(-5);

    // Today's date in Lima, for date-only fields like ProximaAccionFecha.
    public static DateTime Hoy => DesdeUtc(DateTime.UtcNow).Date;

    public static DateTime DesdeUtc(DateTime utc) => utc + Offset;

    public static DateTime AUtc(DateTime lima) => lima - Offset;
}
