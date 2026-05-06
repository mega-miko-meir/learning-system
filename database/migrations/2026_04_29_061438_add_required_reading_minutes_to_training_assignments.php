<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('training_assignments', function (Blueprint $table) {
            $table->unsignedSmallInteger('required_reading_minutes')->default(10)->after('time_spent_seconds');
        });
    }

    public function down(): void
    {
        Schema::table('training_assignments', function (Blueprint $table) {
            $table->dropColumn('required_reading_minutes');
        });
    }
};
