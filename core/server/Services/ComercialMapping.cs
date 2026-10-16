using System.Linq.Expressions;
using Server.Dtos;
using Server.Models;

namespace Server.Services;

// Projections shared by the Comercial controllers. The Expression ones are
// translated to SQL by EF, so list queries only read the columns they need.
public static class ComercialMapping
{
    public static readonly Expression<Func<Oportunidad, OportunidadListItem>> ToListItem = o => new OportunidadListItem
    {
        Id = o.Id,
        Titulo = o.Titulo,
        EmpresaId = o.EmpresaId,
        EmpresaNombre = o.Empresa != null ? o.Empresa.NombreComercial : "—",
        Servicio = o.Servicio,
        Etapa = o.Etapa,
        ValorEstimado = o.ValorEstimado,
        FechaCierreEstimada = o.FechaCierreEstimada,
        ResponsableNombre = o.Responsable != null ? o.Responsable.FullName : null,
        ProximaAccion = o.ProximaAccion,
        ProximaAccionFecha = o.ProximaAccionFecha,
        CerradaAtUtc = o.CerradaAtUtc,
        UpdatedAtUtc = o.UpdatedAtUtc,
    };

    public static readonly Expression<Func<Actividad, ActividadResponse>> ToActividad = a => new ActividadResponse
    {
        Id = a.Id,
        Tipo = a.Tipo,
        Descripcion = a.Descripcion,
        AutorNombre = a.Autor != null ? a.Autor.FullName : "Usuario eliminado",
        OportunidadId = a.OportunidadId,
        OportunidadTitulo = a.Oportunidad != null ? a.Oportunidad.Titulo : null,
        CreatedAtUtc = a.CreatedAtUtc,
    };

    public static ContactoResponse ToContacto(Contacto c) => new()
    {
        Id = c.Id,
        Nombres = c.Nombres,
        Apellidos = c.Apellidos,
        Cargo = c.Cargo,
        Email = c.Email,
        Telefono = c.Telefono,
    };
}
