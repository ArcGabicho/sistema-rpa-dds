using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace server.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddDiagnosticos : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Diagnosticos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    EmpresaId = table.Column<int>(type: "int", nullable: false),
                    OportunidadId = table.Column<int>(type: "int", nullable: true),
                    Titulo = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Estado = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    CostoHora = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: false),
                    Resumen = table.Column<string>(type: "nvarchar(4000)", maxLength: 4000, nullable: true),
                    ResponsableId = table.Column<int>(type: "int", nullable: true),
                    EntregadoAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Diagnosticos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Diagnosticos_AdminUsers_ResponsableId",
                        column: x => x.ResponsableId,
                        principalTable: "AdminUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Diagnosticos_Empresas_EmpresaId",
                        column: x => x.EmpresaId,
                        principalTable: "Empresas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Diagnosticos_Oportunidades_OportunidadId",
                        column: x => x.OportunidadId,
                        principalTable: "Oportunidades",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "ProcesosEvaluados",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    DiagnosticoId = table.Column<int>(type: "int", nullable: false),
                    Nombre = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Area = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: true),
                    Descripcion = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    Servicio = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    EjecucionesMes = table.Column<int>(type: "int", nullable: false),
                    MinutosPorEjecucion = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: false),
                    Personas = table.Column<int>(type: "int", nullable: false),
                    TasaError = table.Column<decimal>(type: "decimal(5,2)", precision: 5, scale: 2, nullable: false),
                    CostoHora = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: true),
                    ReglasClaras = table.Column<int>(type: "int", nullable: false),
                    DatosDigitales = table.Column<int>(type: "int", nullable: false),
                    SistemasEstables = table.Column<int>(type: "int", nullable: false),
                    ProcesoEstandar = table.Column<int>(type: "int", nullable: false),
                    PocasExcepciones = table.Column<int>(type: "int", nullable: false),
                    PorcentajeAutomatizable = table.Column<decimal>(type: "decimal(5,2)", precision: 5, scale: 2, nullable: false),
                    CostoImplementacion = table.Column<decimal>(type: "decimal(14,2)", precision: 14, scale: 2, nullable: false),
                    CostoMensual = table.Column<decimal>(type: "decimal(14,2)", precision: 14, scale: 2, nullable: false),
                    Orden = table.Column<int>(type: "int", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProcesosEvaluados", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProcesosEvaluados_Diagnosticos_DiagnosticoId",
                        column: x => x.DiagnosticoId,
                        principalTable: "Diagnosticos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Diagnosticos_EmpresaId",
                table: "Diagnosticos",
                column: "EmpresaId");

            migrationBuilder.CreateIndex(
                name: "IX_Diagnosticos_Estado",
                table: "Diagnosticos",
                column: "Estado");

            migrationBuilder.CreateIndex(
                name: "IX_Diagnosticos_OportunidadId",
                table: "Diagnosticos",
                column: "OportunidadId");

            migrationBuilder.CreateIndex(
                name: "IX_Diagnosticos_ResponsableId",
                table: "Diagnosticos",
                column: "ResponsableId");

            migrationBuilder.CreateIndex(
                name: "IX_ProcesosEvaluados_DiagnosticoId_Orden",
                table: "ProcesosEvaluados",
                columns: new[] { "DiagnosticoId", "Orden" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ProcesosEvaluados");

            migrationBuilder.DropTable(
                name: "Diagnosticos");
        }
    }
}
