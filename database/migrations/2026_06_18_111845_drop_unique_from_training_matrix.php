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
        $indexes = collect(DB::select("SHOW INDEX FROM training_matrix"))->pluck('Key_name');

        // MySQL uses the unique composite index to enforce the position_id FK.
        // Add a standalone index first so MySQL has another index to fall back to.
        // Older MySQL doesn't support CREATE INDEX IF NOT EXISTS, so check manually.
        if (!$indexes->contains('tm_position_id_idx')) {
            Schema::table('training_matrix', function (Blueprint $table) {
                $table->index('position_id', 'tm_position_id_idx');
            });
        }

        if ($indexes->contains('training_matrix_position_id_document_id_unique')) {
            Schema::table('training_matrix', function (Blueprint $table) {
                $table->dropUnique('training_matrix_position_id_document_id_unique');
            });
        }
    }

    public function down(): void
    {
        Schema::table('training_matrix', function (Blueprint $table) {
            $table->unique(['position_id', 'document_id']);
            $table->dropIndex('tm_position_id_idx');
        });
    }
};
