<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Материалы обучения без теста: видео (файл) и текстовые пункты (например, «Устный инструктаж по GMP»).
        Schema::create('document_materials', function (Blueprint $table) {
            $table->id();
            $table->foreignId('document_id')->constrained()->cascadeOnDelete();
            $table->string('kind', 20);                       // video | text
            $table->string('title');
            $table->text('body')->nullable();                 // описание для text-пункта
            $table->string('file_path')->nullable();          // приватный диск, только для video
            $table->unsignedInteger('duration_seconds')->nullable();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->boolean('is_required')->default(true);
            $table->timestamps();

            $table->index(['document_id', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('document_materials');
    }
};
