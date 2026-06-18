<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::statement('SET FOREIGN_KEY_CHECKS=0');
        Schema::table('training_matrix', function (Blueprint $table) {
            $table->dropUnique('training_matrix_position_id_document_id_unique');
        });
        DB::statement('SET FOREIGN_KEY_CHECKS=1');
    }

    public function down(): void
    {
        Schema::table('training_matrix', function (Blueprint $table) {
            $table->unique(['position_id', 'document_id']);
        });
    }
};
