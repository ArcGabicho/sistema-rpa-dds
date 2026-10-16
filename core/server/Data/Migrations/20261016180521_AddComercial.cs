using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace server.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddComercial : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Empresas",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    NombreComercial = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    RazonSocial = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    Ruc = table.Column<string>(type: "nvarchar(11)", maxLength: 11, nullable: true),
                    Rubro = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    SitioWeb = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Direccion = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Distrito = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: true),
                    Provincia = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: true),
                    Estado = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Origen = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: true),
                    ResponsableId = table.Column<int>(type: "int", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Empresas", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Empresas_AdminUsers_ResponsableId",
                        column: x => x.ResponsableId,
                        principalTable: "AdminUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "Contactos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    EmpresaId = table.Column<int>(type: "int", nullable: false),
                    Nombres = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    Apellidos = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: true),
                    Cargo = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: true),
                    Email = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    Telefono = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Contactos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Contactos_Empresas_EmpresaId",
                        column: x => x.EmpresaId,
                        principalTable: "Empresas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Oportunidades",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    EmpresaId = table.Column<int>(type: "int", nullable: false),
                    ContactoId = table.Column<int>(type: "int", nullable: true),
                    Titulo = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Servicio = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Etapa = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    ValorEstimado = table.Column<decimal>(type: "decimal(14,2)", precision: 14, scale: 2, nullable: true),
                    FechaCierreEstimada = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ResponsableId = table.Column<int>(type: "int", nullable: true),
                    ProximaAccion = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    ProximaAccionFecha = table.Column<DateTime>(type: "datetime2", nullable: true),
                    MotivoPerdida = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    SolicitudId = table.Column<int>(type: "int", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Oportunidades", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Oportunidades_AdminUsers_ResponsableId",
                        column: x => x.ResponsableId,
                        principalTable: "AdminUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Oportunidades_Clients_SolicitudId",
                        column: x => x.SolicitudId,
                        principalTable: "Clients",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Oportunidades_Contactos_ContactoId",
                        column: x => x.ContactoId,
                        principalTable: "Contactos",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Oportunidades_Empresas_EmpresaId",
                        column: x => x.EmpresaId,
                        principalTable: "Empresas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Actividades",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    EmpresaId = table.Column<int>(type: "int", nullable: false),
                    OportunidadId = table.Column<int>(type: "int", nullable: true),
                    Tipo = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Descripcion = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false),
                    AutorId = table.Column<int>(type: "int", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Actividades", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Actividades_AdminUsers_AutorId",
                        column: x => x.AutorId,
                        principalTable: "AdminUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Actividades_Empresas_EmpresaId",
                        column: x => x.EmpresaId,
                        principalTable: "Empresas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Actividades_Oportunidades_OportunidadId",
                        column: x => x.OportunidadId,
                        principalTable: "Oportunidades",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_Actividades_AutorId",
                table: "Actividades",
                column: "AutorId");

            migrationBuilder.CreateIndex(
                name: "IX_Actividades_EmpresaId_CreatedAtUtc",
                table: "Actividades",
                columns: new[] { "EmpresaId", "CreatedAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_Actividades_OportunidadId_CreatedAtUtc",
                table: "Actividades",
                columns: new[] { "OportunidadId", "CreatedAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_Contactos_EmpresaId",
                table: "Contactos",
                column: "EmpresaId");

            migrationBuilder.CreateIndex(
                name: "IX_Empresas_Estado",
                table: "Empresas",
                column: "Estado");

            migrationBuilder.CreateIndex(
                name: "IX_Empresas_NombreComercial",
                table: "Empresas",
                column: "NombreComercial");

            migrationBuilder.CreateIndex(
                name: "IX_Empresas_ResponsableId",
                table: "Empresas",
                column: "ResponsableId");

            migrationBuilder.CreateIndex(
                name: "IX_Empresas_Ruc",
                table: "Empresas",
                column: "Ruc",
                unique: true,
                filter: "[Ruc] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Oportunidades_ContactoId",
                table: "Oportunidades",
                column: "ContactoId");

            migrationBuilder.CreateIndex(
                name: "IX_Oportunidades_EmpresaId",
                table: "Oportunidades",
                column: "EmpresaId");

            migrationBuilder.CreateIndex(
                name: "IX_Oportunidades_Etapa",
                table: "Oportunidades",
                column: "Etapa");

            migrationBuilder.CreateIndex(
                name: "IX_Oportunidades_ProximaAccionFecha",
                table: "Oportunidades",
                column: "ProximaAccionFecha");

            migrationBuilder.CreateIndex(
                name: "IX_Oportunidades_ResponsableId",
                table: "Oportunidades",
                column: "ResponsableId");

            migrationBuilder.CreateIndex(
                name: "IX_Oportunidades_SolicitudId",
                table: "Oportunidades",
                column: "SolicitudId",
                unique: true,
                filter: "[SolicitudId] IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Actividades");

            migrationBuilder.DropTable(
                name: "Oportunidades");

            migrationBuilder.DropTable(
                name: "Contactos");

            migrationBuilder.DropTable(
                name: "Empresas");
        }
    }
}
