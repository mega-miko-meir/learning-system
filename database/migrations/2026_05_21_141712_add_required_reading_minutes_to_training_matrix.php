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
        Schema::table('training_matrix', function (Blueprint $table) {
            $table->unsignedSmallInteger('required_reading_minutes')->default(10)->after('is_mandatory');
        });
    }

    public function down(): void
    {
        Schema::table('training_matrix', function (Blueprint $table) {
            $table->dropColumn('required_reading_minutes');
        });
    }
};
