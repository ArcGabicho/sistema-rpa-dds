using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace server.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddRolesAndClientCrm : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "AssignedToUserId",
                table: "Clients",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "Clients",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                // Backfill for rows that existed before this column: they haven't
                // been through the new triage workflow yet, so "nuevo" is accurate.
                defaultValue: "nuevo");

            migrationBuilder.AddColumn<string>(
                name: "Role",
                table: "AdminUsers",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                // Backfill: every user that existed before roles were introduced
                // was, in practice, an administrator — never leave one locked out
                // of Admin-only actions by this migration.
                defaultValue: "Admin");

            migrationBuilder.CreateTable(
                name: "ClientNotes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ClientId = table.Column<int>(type: "int", nullable: false),
                    AuthorUserId = table.Column<int>(type: "int", nullable: false),
                    Message = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ClientNotes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ClientNotes_AdminUsers_AuthorUserId",
                        column: x => x.AuthorUserId,
                        principalTable: "AdminUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ClientNotes_Clients_ClientId",
                        column: x => x.ClientId,
                        principalTable: "Clients",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Clients_AssignedToUserId",
                table: "Clients",
                column: "AssignedToUserId");

            migrationBuilder.CreateIndex(
                name: "IX_ClientNotes_AuthorUserId",
                table: "ClientNotes",
                column: "AuthorUserId");

            migrationBuilder.CreateIndex(
                name: "IX_ClientNotes_ClientId_CreatedAtUtc",
                table: "ClientNotes",
                columns: new[] { "ClientId", "CreatedAtUtc" });

            migrationBuilder.AddForeignKey(
                name: "FK_Clients_AdminUsers_AssignedToUserId",
                table: "Clients",
                column: "AssignedToUserId",
                principalTable: "AdminUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Clients_AdminUsers_AssignedToUserId",
                table: "Clients");

            migrationBuilder.DropTable(
                name: "ClientNotes");

            migrationBuilder.DropIndex(
                name: "IX_Clients_AssignedToUserId",
                table: "Clients");

            migrationBuilder.DropColumn(
                name: "AssignedToUserId",
                table: "Clients");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "Clients");

            migrationBuilder.DropColumn(
                name: "Role",
                table: "AdminUsers");
        }
    }
}
