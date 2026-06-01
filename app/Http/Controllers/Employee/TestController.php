<?php

namespace App\Http\Controllers\Employee;

use App\Http\Controllers\Controller;
use App\Mail\TestBlocked;
use App\Models\AttemptAnswer;
use App\Models\TestAttempt;
use App\Models\TrainingAssignment;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;

class TestController extends Controller
{
    public function show(TrainingAssignment $assignment)
    {
        abort_if($assignment->user_id !== Auth::id(), 403);
        abort_if(!in_array($assignment->status, ['in_progress', 'pending']), 403);

        $assignment->load('document.test');
        $assignment->document->test->load([
            'questions' => fn($q) => $q->where('is_active', true)->orderBy('order_number'),
            'questions.answers',
        ]);
        $test = $assignment->document->test;
        abort_if(!$test, 404);

        $failedCount = TestAttempt::where('assignment_id', $assignment->id)
            ->whereNotNull('finished_at')
            ->where('is_passed', false)
            ->count();
        abort_if($failedCount >= $test->max_attempts, 403);

        // Создаём/находим попытку прямо здесь, чтобы attempt_id был готов сразу при загрузке страницы
        $attempt = TestAttempt::where('assignment_id', $assignment->id)
            ->whereNull('finished_at')
            ->first();

        if (!$attempt) {
            $attemptNumber = TestAttempt::where('assignment_id', $assignment->id)
                ->whereNotNull('finished_at')
                ->count() + 1;

            if ($assignment->status === 'pending') {
                $assignment->update(['status' => 'in_progress', 'started_at' => now()]);
            }

            $attempt = TestAttempt::create([
                'assignment_id'  => $assignment->id,
                'user_id'        => Auth::id(),
                'test_id'        => $test->id,
                'attempt_number' => $attemptNumber,
                'started_at'     => now(),
            ]);
        }

        $finishedCount = TestAttempt::where('assignment_id', $assignment->id)
            ->whereNotNull('finished_at')
            ->count();

        // Рассчитываем оставшееся время на сервере по started_at попытки
        $timeRemaining = null;
        if ($test->time_limit_minutes) {
            $elapsed       = (int) now()->diffInSeconds($attempt->started_at);
            $timeRemaining = max(0, $test->time_limit_minutes * 60 - $elapsed);
        }

        // Если время истекло пока сотрудник не был на странице — закрываем попытку на сервере
        if ($timeRemaining === 0) {
            $total = $test->questions()->where('is_active', true)->count();
            $attempt->update([
                'finished_at'      => now(),
                'score_percentage'  => 0,
                'correct_answers'   => 0,
                'total_questions'   => $total,
                'is_passed'         => false,
            ]);

            $failedNow = TestAttempt::where('assignment_id', $assignment->id)
                ->whereNotNull('finished_at')
                ->where('is_passed', false)
                ->count();

            $blocked = $failedNow >= $test->max_attempts;
            if ($blocked) {
                $attempt->update(['is_blocked' => true]);
            }

            $assignment->update(['status' => $blocked ? 'failed' : 'in_progress']);

            if ($blocked) {
                try {
                    $this->notifyBlocked($assignment);
                } catch (\Exception $e) {
                    Log::error('TestBlocked email failed: ' . $e->getMessage());
                }
            }

            return redirect()->route('employee.assignments.show', $assignment)
                ->with('info', 'Время теста истекло. Попытка засчитана с результатом 0%.');
        }

        return Inertia::render('Employee/Test/Show', [
            'assignment' => [
                'id'            => $assignment->id,
                'status'        => $assignment->status,
                'attempt_count' => $finishedCount,
                'max_attempts'  => $test->max_attempts,
            ],
            'attempt_id'     => $attempt->id,
            'time_remaining' => $timeRemaining,
            'test' => [
                'id'              => $test->id,
                'title'           => $test->title,
                'pass_percentage' => $test->pass_percentage,
                'time_limit'      => $test->time_limit_minutes,
                'questions'       => $test->questions->map(fn($q) => [
                    'id'      => $q->id,
                    'text'    => $q->question_text,
                    'type'    => $q->question_type,
                    'answers' => $q->answers->map(fn($a) => [
                        'id'   => $a->id,
                        'text' => $a->answer_text,
                    ]),
                ]),
            ],
        ]);
    }

    public function start(TrainingAssignment $assignment)
    {
        abort_if($assignment->user_id !== Auth::id(), 403);

        $assignment->load('document.test');
        $test = $assignment->document->test;
        abort_if(!$test, 404);

        // Если есть незавершённая попытка — возвращаем её (повторное открытие не тратит лимит)
        $existing = TestAttempt::where('assignment_id', $assignment->id)
            ->whereNull('finished_at')
            ->first();

        if ($existing) {
            return response()->json([
                'attempt_id'     => $existing->id,
                'attempt_number' => $existing->attempt_number,
            ]);
        }

        // Новая попытка — проверяем по проваленным завершённым
        $failedCount = TestAttempt::where('assignment_id', $assignment->id)
            ->whereNotNull('finished_at')
            ->where('is_passed', false)
            ->count();
        abort_if($failedCount >= $test->max_attempts, 422);

        $attemptNumber = TestAttempt::where('assignment_id', $assignment->id)
            ->whereNotNull('finished_at')
            ->count() + 1;

        if ($assignment->status === 'pending') {
            $assignment->update(['status' => 'in_progress', 'started_at' => now()]);
        }

        $attempt = TestAttempt::create([
            'assignment_id'  => $assignment->id,
            'user_id'        => Auth::id(),
            'test_id'        => $test->id,
            'attempt_number' => $attemptNumber,
            'started_at'     => now(),
        ]);

        return response()->json([
            'attempt_id'     => $attempt->id,
            'attempt_number' => $attempt->attempt_number,
        ]);
    }

    public function submit(Request $request, TrainingAssignment $assignment)
    {
        abort_if($assignment->user_id !== Auth::id(), 403);

        $request->validate([
            'attempt_id' => ['required', 'exists:test_attempts,id'],
            'answers'    => ['nullable', 'array'],
        ]);

        $attempt = TestAttempt::findOrFail($request->attempt_id);
        abort_if($attempt->assignment_id !== $assignment->id, 403);
        abort_if($attempt->finished_at !== null, 422); // уже сдана

        $test  = $assignment->document->test->load([
            'questions' => fn($q) => $q->where('is_active', true),
            'questions.answers',
        ]);
        $total = $test->questions->count();
        $correct = 0;

        foreach ($test->questions as $question) {
            $givenId       = $request->answers[$question->id] ?? null;
            $correctAnswer = $question->answers->firstWhere('is_correct', true);
            $isCorrect     = $givenId && $correctAnswer && (int) $givenId === $correctAnswer->id;

            if ($isCorrect) $correct++;

            if ($givenId) {
                AttemptAnswer::create([
                    'attempt_id'  => $attempt->id,
                    'question_id' => $question->id,
                    'answer_id'   => (int) $givenId,
                    'is_correct'  => $isCorrect,
                ]);
            }
        }

        $score  = $total > 0 ? round($correct / $total * 100) : 0;
        $passed = $score >= $test->pass_percentage;

        $attempt->update([
            'finished_at'      => now(),
            'score_percentage'  => $score,
            'correct_answers'   => $correct,
            'total_questions'   => $total,
            'is_passed'         => $passed,
        ]);

        // Блокируем только по завершённым проваленным
        $failedCount = TestAttempt::where('assignment_id', $assignment->id)
            ->whereNotNull('finished_at')
            ->where('is_passed', false)
            ->count();
        $blocked = !$passed && $failedCount >= $test->max_attempts;

        if ($blocked) {
            $attempt->update(['is_blocked' => true]);
        }

        $assignment->update([
            'status'       => $passed ? 'completed' : ($blocked ? 'failed' : 'in_progress'),
            'completed_at' => $passed ? now() : null,
        ]);

        if ($blocked) {
            try {
                $this->notifyBlocked($assignment);
            } catch (\Exception $e) {
                Log::error('TestBlocked email failed: ' . $e->getMessage());
            }
        }

        return response()->json([
            'score'         => $score,
            'passed'        => $passed,
            'blocked'       => $blocked,
            'attempts_left' => max(0, $test->max_attempts - $failedCount),
        ]);
    }

    // ─── Уведомление о блокировке ─────────────────────────────
    private function notifyBlocked(TrainingAssignment $assignment): void
    {
        $assignment->load(['user.manager', 'document']);

        // Руководителю сотрудника
        $manager = $assignment->user->manager;
        if ($manager?->email) {
            Mail::to($manager->email)->queue(new TestBlocked($assignment, 'manager'));
        }

        // Всем администраторам (admin) у кого есть email
        User::whereIn('role', ['admin'])
            ->whereNotNull('email')
            ->where('is_active', true)
            ->get()
            ->each(fn($admin) => Mail::to($admin->email)->queue(new TestBlocked($assignment, 'admin')));
    }
}
