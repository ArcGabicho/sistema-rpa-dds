using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace server.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddPropuestas : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Propuestas",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Codigo = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Version = table.Column<int>(type: "int", nullable: false),
                    EmpresaId = table.Column<int>(type: "int", nullable: false),
                    OportunidadId = table.Column<int>(type: "int", nullable: true),
                    DiagnosticoId = table.Column<int>(type: "int", nullable: true),
                    Titulo = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Estado = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Moneda = table.Column<string>(type: "nvarchar(3)", maxLength: 3, nullable: false),
                    DescuentoPorcentaje = table.Column<decimal>(type: "decimal(5,2)", precision: 5, scale: 2, nullable: false),
                    AhorroAnualEstimado = table.Column<decimal>(type: "decimal(14,2)", precision: 14, scale: 2, nullable: true),
                    Introduccion = table.Column<string>(type: "nvarchar(4000)", maxLength: 4000, nullable: true),
                    Supuestos = table.Column<string>(type: "nvarchar(4000)", maxLength: 4000, nullable: true),
                    Exclusiones = table.Column<string>(type: "nvarchar(4000)", maxLength: 4000, nullable: true),
                    CondicionesPago = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    ValidaHasta = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ResponsableId = table.Column<int>(type: "int", nullable: true),
                    EnviadaAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    RespondidaAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    MotivoRechazo = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Propuestas", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Propuestas_AdminUsers_ResponsableId",
                        column: x => x.ResponsableId,
                        principalTable: "AdminUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Propuestas_Diagnosticos_DiagnosticoId",
                        column: x => x.DiagnosticoId,
                        principalTable: "Diagnosticos",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Propuestas_Empresas_EmpresaId",
                        column: x => x.EmpresaId,
                        principalTable: "Empresas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Propuestas_Oportunidades_OportunidadId",
                        column: x => x.OportunidadId,
                        principalTable: "Oportunidades",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "PropuestaFases",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PropuestaId = table.Column<int>(type: "int", nullable: false),
                    Nombre = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Descripcion = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    Semanas = table.Column<int>(type: "int", nullable: false),
                    Orden = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PropuestaFases", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PropuestaFases_Propuestas_PropuestaId",
                        column: x => x.PropuestaId,
                        principalTable: "Propuestas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PropuestaItems",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PropuestaId = table.Column<int>(type: "int", nullable: false),
                    Tipo = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Descripcion = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    Detalle = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    Cantidad = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: false),
                    PrecioUnitario = table.Column<decimal>(type: "decimal(14,2)", precision: 14, scale: 2, nullable: false),
                    Orden = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PropuestaItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PropuestaItems_Propuestas_PropuestaId",
                        column: x => x.PropuestaId,
                        principalTable: "Propuestas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PropuestaFases_PropuestaId_Orden",
                table: "PropuestaFases",
                columns: new[] { "PropuestaId", "Orden" });

            migrationBuilder.CreateIndex(
                name: "IX_PropuestaItems_PropuestaId_Orden",
                table: "PropuestaItems",
                columns: new[] { "PropuestaId", "Orden" });

            migrationBuilder.CreateIndex(
                name: "IX_Propuestas_Codigo_Version",
                table: "Propuestas",
                columns: new[] { "Codigo", "Version" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Propuestas_DiagnosticoId",
                table: "Propuestas",
                column: "DiagnosticoId");

            migrationBuilder.CreateIndex(
                name: "IX_Propuestas_EmpresaId",
                table: "Propuestas",
                column: "EmpresaId");

            migrationBuilder.CreateIndex(
                name: "IX_Propuestas_Estado",
                table: "Propuestas",
                column: "Estado");

            migrationBuilder.CreateIndex(
                name: "IX_Propuestas_OportunidadId",
                table: "Propuestas",
                column: "OportunidadId");

            migrationBuilder.CreateIndex(
                name: "IX_Propuestas_ResponsableId",
                table: "Propuestas",
                column: "ResponsableId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PropuestaFases");

            migrationBuilder.DropTable(
                name: "PropuestaItems");

            migrationBuilder.DropTable(
                name: "Propuestas");
        }
    }
}
