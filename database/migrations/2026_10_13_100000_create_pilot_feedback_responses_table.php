<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Анкета обратной связи по пилоту системы обучения. Заполняется анонимно (без привязки
        // к user_id) — форма доступна без авторизации по прямой ссылке.
        Schema::create('pilot_feedback_responses', function (Blueprint $table) {
            $table->id();
            $table->unsignedTinyInteger('nav_rating')->nullable();
            $table->text('nav_comment')->nullable();
            $table->string('had_issues', 20)->nullable();
            $table->text('issue_description')->nullable();
            $table->string('timer_buttons_ok', 20)->nullable();
            $table->text('timer_buttons_comment')->nullable();
            $table->string('retry_clarity', 40)->nullable();
            $table->text('retry_comment')->nullable();
            $table->text('liked')->nullable();
            $table->text('difficulties')->nullable();
            $table->text('suggestions')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pilot_feedback_responses');
    }
};
