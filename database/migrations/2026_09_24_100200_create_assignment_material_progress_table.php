<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Прогресс просмотра видео конкретным назначением. max_position_seconds только растёт.
        Schema::create('assignment_material_progress', function (Blueprint $table) {
            $table->id();
            $table->foreignId('assignment_id')->constrained('training_assignments')->cascadeOnDelete();
            $table->foreignId('material_id')->constrained('document_materials')->cascadeOnDelete();
            $table->unsignedInteger('max_position_seconds')->default(0);
            $table->timestamp('last_heartbeat_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->unique(['assignment_id', 'material_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('assignment_material_progress');
    }
};
