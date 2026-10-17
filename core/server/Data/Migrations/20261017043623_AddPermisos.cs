using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace server.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddPermisos : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "Activo",
                table: "AdminUsers",
                type: "bit",
                nullable: false,
                // Everyone who exists today stays active.
                defaultValue: true);

            migrationBuilder.CreateTable(
                name: "PermisosUsuario",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UsuarioId = table.Column<int>(type: "int", nullable: false),
                    Modulo = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Nivel = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PermisosUsuario", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PermisosUsuario_AdminUsers_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "AdminUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PermisosUsuario_UsuarioId_Modulo",
                table: "PermisosUsuario",
                columns: new[] { "UsuarioId", "Modulo" },
                unique: true);

            // The old "Operador" could do everything except administer: it
            // becomes a Consultor with Comercial, Propuestas and Operación
            // raised to "editar", so nobody loses access.
            migrationBuilder.Sql("""
                INSERT INTO PermisosUsuario (UsuarioId, Modulo, Nivel)
                SELECT u.Id, m.Modulo, 'editar'
                FROM AdminUsers u CROSS JOIN (VALUES ('comercial'), ('propuestas'), ('operacion')) AS m(Modulo)
                WHERE u.Role = 'Operador';
                UPDATE AdminUsers SET Role = 'Consultor' WHERE Role = 'Operador';
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("UPDATE AdminUsers SET Role = 'Operador' WHERE Role IN ('Comercial', 'Consultor', 'Soporte');");

            migrationBuilder.DropTable(
                name: "PermisosUsuario");

            migrationBuilder.DropColumn(
                name: "Activo",
                table: "AdminUsers");
        }
    }
}
