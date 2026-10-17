using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace server.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddProyectos : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ProcesoOrigenId",
                table: "PropuestaItems",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Proyectos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Nombre = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Descripcion = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    Estado = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    EmpresaId = table.Column<int>(type: "int", nullable: false),
                    OportunidadId = table.Column<int>(type: "int", nullable: true),
                    PropuestaId = table.Column<int>(type: "int", nullable: true),
                    ResponsableId = table.Column<int>(type: "int", nullable: true),
                    FechaInicio = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FechaFinPlan = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FechaFinReal = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Proyectos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Proyectos_AdminUsers_ResponsableId",
                        column: x => x.ResponsableId,
                        principalTable: "AdminUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Proyectos_Empresas_EmpresaId",
                        column: x => x.EmpresaId,
                        principalTable: "Empresas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Proyectos_Oportunidades_OportunidadId",
                        column: x => x.OportunidadId,
                        principalTable: "Oportunidades",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Proyectos_Propuestas_PropuestaId",
                        column: x => x.PropuestaId,
                        principalTable: "Propuestas",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "Hitos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ProyectoId = table.Column<int>(type: "int", nullable: false),
                    Nombre = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Descripcion = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    Estado = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    FechaInicio = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FechaFin = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CompletadoAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Orden = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Hitos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Hitos_Proyectos_ProyectoId",
                        column: x => x.ProyectoId,
                        principalTable: "Proyectos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ProcesosProyecto",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ProyectoId = table.Column<int>(type: "int", nullable: false),
                    ProcesoOrigenId = table.Column<int>(type: "int", nullable: true),
                    Nombre = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Area = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: true),
                    Servicio = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Etapa = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Orden = table.Column<int>(type: "int", nullable: false),
                    NotasLevantamiento = table.Column<string>(type: "nvarchar(max)", maxLength: 8000, nullable: true),
                    PddEstado = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    PddObjetivo = table.Column<string>(type: "nvarchar(max)", maxLength: 6000, nullable: true),
                    PddAlcance = table.Column<string>(type: "nvarchar(max)", maxLength: 6000, nullable: true),
                    PddSistemas = table.Column<string>(type: "nvarchar(max)", maxLength: 6000, nullable: true),
                    PddEntradas = table.Column<string>(type: "nvarchar(max)", maxLength: 6000, nullable: true),
                    PddSalidas = table.Column<string>(type: "nvarchar(max)", maxLength: 6000, nullable: true),
                    PddPasosActuales = table.Column<string>(type: "nvarchar(max)", maxLength: 6000, nullable: true),
                    PddReglas = table.Column<string>(type: "nvarchar(max)", maxLength: 6000, nullable: true),
                    PddExcepciones = table.Column<string>(type: "nvarchar(max)", maxLength: 6000, nullable: true),
                    PddPasosPropuestos = table.Column<string>(type: "nvarchar(max)", maxLength: 6000, nullable: true),
                    PddPreguntas = table.Column<string>(type: "nvarchar(max)", maxLength: 6000, nullable: true),
                    PddVersion = table.Column<int>(type: "int", nullable: false),
                    PddConIa = table.Column<bool>(type: "bit", nullable: false),
                    PddAprobadoPor = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    PddAprobadoAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProcesosProyecto", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProcesosProyecto_Proyectos_ProyectoId",
                        column: x => x.ProyectoId,
                        principalTable: "Proyectos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Tareas",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ProyectoId = table.Column<int>(type: "int", nullable: false),
                    HitoId = table.Column<int>(type: "int", nullable: true),
                    Titulo = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    Estado = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    ResponsableId = table.Column<int>(type: "int", nullable: true),
                    FechaLimite = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Bloqueo = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    CompletadaAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Orden = table.Column<int>(type: "int", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Tareas", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Tareas_AdminUsers_ResponsableId",
                        column: x => x.ResponsableId,
                        principalTable: "AdminUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Tareas_Hitos_HitoId",
                        column: x => x.HitoId,
                        principalTable: "Hitos",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Tareas_Proyectos_ProyectoId",
                        column: x => x.ProyectoId,
                        principalTable: "Proyectos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Hitos_ProyectoId_Orden",
                table: "Hitos",
                columns: new[] { "ProyectoId", "Orden" });

            migrationBuilder.CreateIndex(
                name: "IX_ProcesosProyecto_ProyectoId_Orden",
                table: "ProcesosProyecto",
                columns: new[] { "ProyectoId", "Orden" });

            migrationBuilder.CreateIndex(
                name: "IX_Proyectos_EmpresaId",
                table: "Proyectos",
                column: "EmpresaId");

            migrationBuilder.CreateIndex(
                name: "IX_Proyectos_Estado",
                table: "Proyectos",
                column: "Estado");

            migrationBuilder.CreateIndex(
                name: "IX_Proyectos_OportunidadId",
                table: "Proyectos",
                column: "OportunidadId");

            migrationBuilder.CreateIndex(
                name: "IX_Proyectos_PropuestaId",
                table: "Proyectos",
                column: "PropuestaId");

            migrationBuilder.CreateIndex(
                name: "IX_Proyectos_ResponsableId",
                table: "Proyectos",
                column: "ResponsableId");

            migrationBuilder.CreateIndex(
                name: "IX_Tareas_HitoId",
                table: "Tareas",
                column: "HitoId");

            migrationBuilder.CreateIndex(
                name: "IX_Tareas_ProyectoId_Orden",
                table: "Tareas",
                columns: new[] { "ProyectoId", "Orden" });

            migrationBuilder.CreateIndex(
                name: "IX_Tareas_ResponsableId_Estado",
                table: "Tareas",
                columns: new[] { "ResponsableId", "Estado" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ProcesosProyecto");

            migrationBuilder.DropTable(
                name: "Tareas");

            migrationBuilder.DropTable(
                name: "Hitos");

            migrationBuilder.DropTable(
                name: "Proyectos");

            migrationBuilder.DropColumn(
                name: "ProcesoOrigenId",
                table: "PropuestaItems");
        }
    }
}
