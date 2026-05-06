<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Назначения на обучение (задания для конкретного сотрудника)
        Schema::create('training_assignments', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('document_id')->constrained()->cascadeOnDelete();
            $table->foreignId('matrix_id')->nullable()->constrained('training_matrix')->nullOnDelete();

            $table->enum('training_type', ['primary', 'periodic', 'unplanned', 'special'])->default('primary');

            $table->enum('status', [
                'pending',      // Назначено, ещё не начато
                'in_progress',  // Читает документ
                'testing',      // Перешёл к тесту
                'completed',    // Тест пройден успешно
                'failed',       // Превышен лимит попыток
                'expired',      // Просрочено
            ])->default('pending');

            $table->timestamp('due_date')->nullable();       // Дедлайн
            $table->timestamp('started_at')->nullable();     // Когда начал читать
            $table->timestamp('completed_at')->nullable();   // Когда завершил
            $table->unsignedInteger('time_spent_seconds')->default(0); // Суммарное время чтения

            $table->timestamps();

            $table->index(['user_id', 'status']);
            $table->index('due_date');
        });

        // Тесты (один тест на один документ)
        Schema::create('tests', function (Blueprint $table) {
            $table->id();

            $table->foreignId('document_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->unsignedTinyInteger('pass_percentage')->default(70); // Порог прохождения %
            $table->unsignedTinyInteger('max_attempts')->default(3);      // Лимит попыток
            $table->unsignedInteger('time_limit_minutes')->nullable();    // Ограничение времени (null = без лимита)

            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Вопросы теста
        Schema::create('questions', function (Blueprint $table) {
            $table->id();

            $table->foreignId('test_id')->constrained()->cascadeOnDelete();
            $table->text('question_text');
            $table->enum('question_type', [
                'single',   // Один правильный ответ
                'multiple', // Несколько правильных ответов
            ])->default('single');
            $table->unsignedSmallInteger('order_number')->default(0);
            $table->boolean('is_active')->default(true);

            $table->timestamps();
            $table->index(['test_id', 'order_number']);
        });

        // Варианты ответов
        Schema::create('answers', function (Blueprint $table) {
            $table->id();

            $table->foreignId('question_id')->constrained()->cascadeOnDelete();
            $table->text('answer_text');
            $table->boolean('is_correct')->default(false);
            $table->unsignedSmallInteger('order_number')->default(0);

            $table->timestamps();
        });

        // Попытки прохождения теста
        Schema::create('test_attempts', function (Blueprint $table) {
            $table->id();

            $table->foreignId('assignment_id')->constrained('training_assignments')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('test_id')->constrained()->cascadeOnDelete();

            $table->unsignedTinyInteger('attempt_number');
            $table->unsignedTinyInteger('score_percentage')->nullable();  // % правильных ответов
            $table->unsignedTinyInteger('correct_answers')->nullable();    // Кол-во правильных
            $table->unsignedTinyInteger('total_questions')->nullable();    // Всего вопросов

            $table->boolean('is_passed')->default(false);
            $table->boolean('is_blocked')->default(false); // Заблокирован после лимита попыток

            $table->timestamp('started_at');
            $table->timestamp('finished_at')->nullable();

            $table->timestamps();

            $table->index(['assignment_id', 'attempt_number']);
            $table->index(['user_id', 'is_passed']);
        });

        // Ответы на конкретную попытку (детализация)
        // Только INSERT — никаких UPDATE (целостность данных по GxP)
        Schema::create('attempt_answers', function (Blueprint $table) {
            $table->id();

            $table->foreignId('attempt_id')->constrained('test_attempts')->cascadeOnDelete();
            $table->foreignId('question_id')->constrained()->cascadeOnDelete();
            $table->foreignId('answer_id')->constrained()->cascadeOnDelete();
            $table->boolean('is_correct');

            // Без timestamps — запись неизменяема
            $table->timestamp('created_at')->useCurrent();

            $table->index('attempt_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attempt_answers');
        Schema::dropIfExists('test_attempts');
        Schema::dropIfExists('answers');
        Schema::dropIfExists('questions');
        Schema::dropIfExists('tests');
        Schema::dropIfExists('training_assignments');
    }
};
