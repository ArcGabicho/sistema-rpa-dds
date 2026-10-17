using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace server.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddOperacion : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Bots",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Nombre = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Descripcion = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    Servicio = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Estado = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    EmpresaId = table.Column<int>(type: "int", nullable: false),
                    ProyectoId = table.Column<int>(type: "int", nullable: true),
                    ProcesoProyectoId = table.Column<int>(type: "int", nullable: true),
                    Plataforma = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Horario = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    EnProduccionDesde = table.Column<DateTime>(type: "datetime2", nullable: false),
                    RetiradoEl = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ResponsableId = table.Column<int>(type: "int", nullable: true),
                    HorasMesEstimadas = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: false),
                    CostoHora = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: false),
                    MinutosPorCaso = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Bots", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Bots_AdminUsers_ResponsableId",
                        column: x => x.ResponsableId,
                        principalTable: "AdminUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Bots_Empresas_EmpresaId",
                        column: x => x.EmpresaId,
                        principalTable: "Empresas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Bots_ProcesosProyecto_ProcesoProyectoId",
                        column: x => x.ProcesoProyectoId,
                        principalTable: "ProcesosProyecto",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Bots_Proyectos_ProyectoId",
                        column: x => x.ProyectoId,
                        principalTable: "Proyectos",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "ContratosSoporte",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    EmpresaId = table.Column<int>(type: "int", nullable: false),
                    PropuestaId = table.Column<int>(type: "int", nullable: true),
                    Nombre = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Estado = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    MontoMensual = table.Column<decimal>(type: "decimal(14,2)", precision: 14, scale: 2, nullable: false),
                    Moneda = table.Column<string>(type: "nvarchar(3)", maxLength: 3, nullable: false),
                    FechaInicio = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FechaFin = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Notas = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    OportunidadRenovacionId = table.Column<int>(type: "int", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ContratosSoporte", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ContratosSoporte_Empresas_EmpresaId",
                        column: x => x.EmpresaId,
                        principalTable: "Empresas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ContratosSoporte_Oportunidades_OportunidadRenovacionId",
                        column: x => x.OportunidadRenovacionId,
                        principalTable: "Oportunidades",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_ContratosSoporte_Propuestas_PropuestaId",
                        column: x => x.PropuestaId,
                        principalTable: "Propuestas",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "Incidencias",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Codigo = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Titulo = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Descripcion = table.Column<string>(type: "nvarchar(4000)", maxLength: 4000, nullable: true),
                    EmpresaId = table.Column<int>(type: "int", nullable: false),
                    BotId = table.Column<int>(type: "int", nullable: true),
                    Severidad = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Estado = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Canal = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Causa = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    ReportadoPor = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    ResponsableId = table.Column<int>(type: "int", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    PrimeraRespuestaAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    PausadaDesdeUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    MinutosEnPausa = table.Column<int>(type: "int", nullable: false),
                    ResueltaAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Solucion = table.Column<string>(type: "nvarchar(4000)", maxLength: 4000, nullable: true),
                    UpdatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Incidencias", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Incidencias_AdminUsers_ResponsableId",
                        column: x => x.ResponsableId,
                        principalTable: "AdminUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Incidencias_Bots_BotId",
                        column: x => x.BotId,
                        principalTable: "Bots",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Incidencias_Empresas_EmpresaId",
                        column: x => x.EmpresaId,
                        principalTable: "Empresas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Licencias",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    EmpresaId = table.Column<int>(type: "int", nullable: true),
                    BotId = table.Column<int>(type: "int", nullable: true),
                    Nombre = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Proveedor = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Cantidad = table.Column<int>(type: "int", nullable: false),
                    CostoAnual = table.Column<decimal>(type: "decimal(14,2)", precision: 14, scale: 2, nullable: true),
                    Moneda = table.Column<string>(type: "nvarchar(3)", maxLength: 3, nullable: false),
                    PagaCliente = table.Column<bool>(type: "bit", nullable: false),
                    VenceEl = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Notas = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Licencias", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Licencias_Bots_BotId",
                        column: x => x.BotId,
                        principalTable: "Bots",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Licencias_Empresas_EmpresaId",
                        column: x => x.EmpresaId,
                        principalTable: "Empresas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MedicionesBot",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    BotId = table.Column<int>(type: "int", nullable: false),
                    Mes = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Ejecuciones = table.Column<int>(type: "int", nullable: false),
                    EjecucionesFallidas = table.Column<int>(type: "int", nullable: false),
                    CasosProcesados = table.Column<int>(type: "int", nullable: false),
                    CasosDerivados = table.Column<int>(type: "int", nullable: false),
                    Notas = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    UpdatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MedicionesBot", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MedicionesBot_Bots_BotId",
                        column: x => x.BotId,
                        principalTable: "Bots",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SeguimientosIncidencia",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    IncidenciaId = table.Column<int>(type: "int", nullable: false),
                    Tipo = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Texto = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false),
                    AutorId = table.Column<int>(type: "int", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SeguimientosIncidencia", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SeguimientosIncidencia_AdminUsers_AutorId",
                        column: x => x.AutorId,
                        principalTable: "AdminUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_SeguimientosIncidencia_Incidencias_IncidenciaId",
                        column: x => x.IncidenciaId,
                        principalTable: "Incidencias",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Bots_EmpresaId",
                table: "Bots",
                column: "EmpresaId");

            migrationBuilder.CreateIndex(
                name: "IX_Bots_Estado",
                table: "Bots",
                column: "Estado");

            migrationBuilder.CreateIndex(
                name: "IX_Bots_ProcesoProyectoId",
                table: "Bots",
                column: "ProcesoProyectoId",
                unique: true,
                filter: "[ProcesoProyectoId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Bots_ProyectoId",
                table: "Bots",
                column: "ProyectoId");

            migrationBuilder.CreateIndex(
                name: "IX_Bots_ResponsableId",
                table: "Bots",
                column: "ResponsableId");

            migrationBuilder.CreateIndex(
                name: "IX_ContratosSoporte_EmpresaId",
                table: "ContratosSoporte",
                column: "EmpresaId");

            migrationBuilder.CreateIndex(
                name: "IX_ContratosSoporte_Estado_FechaFin",
                table: "ContratosSoporte",
                columns: new[] { "Estado", "FechaFin" });

            migrationBuilder.CreateIndex(
                name: "IX_ContratosSoporte_OportunidadRenovacionId",
                table: "ContratosSoporte",
                column: "OportunidadRenovacionId");

            migrationBuilder.CreateIndex(
                name: "IX_ContratosSoporte_PropuestaId",
                table: "ContratosSoporte",
                column: "PropuestaId");

            migrationBuilder.CreateIndex(
                name: "IX_Incidencias_BotId",
                table: "Incidencias",
                column: "BotId");

            migrationBuilder.CreateIndex(
                name: "IX_Incidencias_Codigo",
                table: "Incidencias",
                column: "Codigo",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Incidencias_EmpresaId",
                table: "Incidencias",
                column: "EmpresaId");

            migrationBuilder.CreateIndex(
                name: "IX_Incidencias_Estado_CreatedAtUtc",
                table: "Incidencias",
                columns: new[] { "Estado", "CreatedAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_Incidencias_ResponsableId",
                table: "Incidencias",
                column: "ResponsableId");

            migrationBuilder.CreateIndex(
                name: "IX_Incidencias_ResueltaAtUtc",
                table: "Incidencias",
                column: "ResueltaAtUtc");

            migrationBuilder.CreateIndex(
                name: "IX_Licencias_BotId",
                table: "Licencias",
                column: "BotId");

            migrationBuilder.CreateIndex(
                name: "IX_Licencias_EmpresaId",
                table: "Licencias",
                column: "EmpresaId");

            migrationBuilder.CreateIndex(
                name: "IX_Licencias_VenceEl",
                table: "Licencias",
                column: "VenceEl");

            migrationBuilder.CreateIndex(
                name: "IX_MedicionesBot_BotId_Mes",
                table: "MedicionesBot",
                columns: new[] { "BotId", "Mes" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SeguimientosIncidencia_AutorId",
                table: "SeguimientosIncidencia",
                column: "AutorId");

            migrationBuilder.CreateIndex(
                name: "IX_SeguimientosIncidencia_IncidenciaId_CreatedAtUtc",
                table: "SeguimientosIncidencia",
                columns: new[] { "IncidenciaId", "CreatedAtUtc" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ContratosSoporte");

            migrationBuilder.DropTable(
                name: "Licencias");

            migrationBuilder.DropTable(
                name: "MedicionesBot");

            migrationBuilder.DropTable(
                name: "SeguimientosIncidencia");

            migrationBuilder.DropTable(
                name: "Incidencias");

            migrationBuilder.DropTable(
                name: "Bots");
        }
    }
}
