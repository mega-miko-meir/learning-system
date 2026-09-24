<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 'test' — как раньше (чтение + тест). 'confirmation' — без теста: просмотр видео + подтверждение ознакомления.
        Schema::table('documents', function (Blueprint $table) {
            $table->string('completion_mode', 20)->default('test')->after('type');
        });

        Schema::table('training_assignments', function (Blueprint $table) {
            $table->timestamp('acknowledged_at')->nullable()->after('completed_at');
        });
    }

    public function down(): void
    {
        Schema::table('training_assignments', function (Blueprint $table) {
            $table->dropColumn('acknowledged_at');
        });

        Schema::table('documents', function (Blueprint $table) {
            $table->dropColumn('completion_mode');
        });
    }
};
