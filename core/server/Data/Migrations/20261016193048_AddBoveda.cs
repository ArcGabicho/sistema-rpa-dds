using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace server.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddBoveda : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Actividades_AdminUsers_AutorId",
                table: "Actividades");

            migrationBuilder.DropForeignKey(
                name: "FK_ClientNotes_AdminUsers_AuthorUserId",
                table: "ClientNotes");

            migrationBuilder.AlterColumn<int>(
                name: "AuthorUserId",
                table: "ClientNotes",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AlterColumn<int>(
                name: "AutorId",
                table: "Actividades",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.CreateTable(
                name: "Secretos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Uid = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Nombre = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Tipo = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    EmpresaId = table.Column<int>(type: "int", nullable: true),
                    Usuario = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    Url = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Notas = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    ValorCifrado = table.Column<byte[]>(type: "varbinary(max)", nullable: false),
                    Restringido = table.Column<bool>(type: "bit", nullable: false),
                    VenceEl = table.Column<DateTime>(type: "datetime2", nullable: true),
                    RotadoAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Secretos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Secretos_Empresas_EmpresaId",
                        column: x => x.EmpresaId,
                        principalTable: "Empresas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AccesosSecreto",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SecretoId = table.Column<int>(type: "int", nullable: true),
                    SecretoNombre = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    UsuarioId = table.Column<int>(type: "int", nullable: true),
                    UsuarioNombre = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Accion = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Ip = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AccesosSecreto", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AccesosSecreto_AdminUsers_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "AdminUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_AccesosSecreto_Secretos_SecretoId",
                        column: x => x.SecretoId,
                        principalTable: "Secretos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AccesosSecreto_CreatedAtUtc",
                table: "AccesosSecreto",
                column: "CreatedAtUtc");

            migrationBuilder.CreateIndex(
                name: "IX_AccesosSecreto_SecretoId_CreatedAtUtc",
                table: "AccesosSecreto",
                columns: new[] { "SecretoId", "CreatedAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_AccesosSecreto_UsuarioId",
                table: "AccesosSecreto",
                column: "UsuarioId");

            migrationBuilder.CreateIndex(
                name: "IX_Secretos_EmpresaId",
                table: "Secretos",
                column: "EmpresaId");

            migrationBuilder.CreateIndex(
                name: "IX_Secretos_Nombre",
                table: "Secretos",
                column: "Nombre");

            migrationBuilder.CreateIndex(
                name: "IX_Secretos_Uid",
                table: "Secretos",
                column: "Uid",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Secretos_VenceEl",
                table: "Secretos",
                column: "VenceEl");

            migrationBuilder.AddForeignKey(
                name: "FK_Actividades_AdminUsers_AutorId",
                table: "Actividades",
                column: "AutorId",
                principalTable: "AdminUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_ClientNotes_AdminUsers_AuthorUserId",
                table: "ClientNotes",
                column: "AuthorUserId",
                principalTable: "AdminUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Actividades_AdminUsers_AutorId",
                table: "Actividades");

            migrationBuilder.DropForeignKey(
                name: "FK_ClientNotes_AdminUsers_AuthorUserId",
                table: "ClientNotes");

            migrationBuilder.DropTable(
                name: "AccesosSecreto");

            migrationBuilder.DropTable(
                name: "Secretos");

            migrationBuilder.AlterColumn<int>(
                name: "AuthorUserId",
                table: "ClientNotes",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.AlterColumn<int>(
                name: "AutorId",
                table: "Actividades",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Actividades_AdminUsers_AutorId",
                table: "Actividades",
                column: "AutorId",
                principalTable: "AdminUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_ClientNotes_AdminUsers_AuthorUserId",
                table: "ClientNotes",
                column: "AuthorUserId",
                principalTable: "AdminUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
