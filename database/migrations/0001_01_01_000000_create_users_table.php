<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();

            // Личные данные
            $table->string('last_name');
            $table->string('first_name');
            $table->string('middle_name')->nullable();

            // Роль в системе
            $table->enum('role', ['admin', 'hr_admin', 'manager', 'employee'])->default('employee');

            // Логин: сотрудники входят по телефону, остальные по email
            $table->string('phone')->nullable()->unique();   // для employee
            $table->string('email')->nullable()->unique();   // для admin, hr_admin, manager
            $table->string('password');

            // Организационная структура
            $table->foreignId('department_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('position_id')->nullable()->constrained()->nullOnDelete();
            $table->unsignedBigInteger('manager_id')->nullable(); // FK на users.id

            // Статус
            $table->boolean('is_active')->default(true);
            $table->date('hired_at')->nullable();
            $table->date('fired_at')->nullable();

            // Для сброса пароля через администратора
            $table->boolean('must_change_password')->default(true);

            $table->rememberToken();
            $table->timestamps();

            // Индексы для поиска
            $table->index('role');
            $table->index('department_id');
            $table->index('is_active');
        });

        // Добавляем FK на manager_id после создания таблицы
        Schema::table('users', function (Blueprint $table) {
            $table->foreign('manager_id')->references('id')->on('users')->nullOnDelete();
        });

        // Добавляем FK в departments.manager_id теперь когда users существует
        Schema::table('departments', function (Blueprint $table) {
            $table->foreign('manager_id')->references('id')->on('users')->nullOnDelete();
        });

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('departments', function (Blueprint $table) {
            $table->dropForeign(['manager_id']);
        });
        Schema::dropIfExists('users');
        Schema::dropIfExists('password_reset_tokens');
    }
};
