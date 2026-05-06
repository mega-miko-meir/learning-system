<?php

use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        \DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('superadmin','admin','hr_admin','manager','employee') NOT NULL DEFAULT 'employee'");
    }

    public function down(): void
    {
        \DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('admin','hr_admin','manager','employee') NOT NULL DEFAULT 'employee'");
    }
};
