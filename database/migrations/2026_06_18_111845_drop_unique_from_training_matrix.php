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
        // MySQL uses the unique composite index to enforce the position_id FK.
        // We must add a standalone index on position_id first so MySQL has
        // another index to fall back to before we drop the unique constraint.
        Schema::table('training_matrix', function (Blueprint $table) {
            $table->index('position_id', 'tm_position_id_idx');
        });

        DB::statement('ALTER TABLE training_matrix DROP INDEX IF EXISTS training_matrix_position_id_document_id_unique');
    }

    public function down(): void
    {
        Schema::table('training_matrix', function (Blueprint $table) {
            $table->unique(['position_id', 'document_id']);
            $table->dropIndex('tm_position_id_idx');
        });
    }
};
