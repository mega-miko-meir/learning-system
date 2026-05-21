<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Answer;
use App\Models\AuditLog;
use App\Models\Document;
use App\Models\Question;
use App\Models\Test;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TestController extends Controller
{
    public function index()
    {
        $tests = Test::with('document')
            ->latest()
            ->paginate(20)
            ->through(fn($t) => [
                'id'              => $t->id,
                'title'           => $t->title,
                'document'        => $t->document?->title,
                'questions_count' => $t->questions()->where('is_active', true)->count(),
                'passing_score'   => $t->passing_score,
                'is_active'       => $t->is_active,
            ]);

        return Inertia::render('Admin/Tests/Index', compact('tests'));
    }

    public function create(Request $request)
    {
        $documents = Document::active()->orderBy('title')->get(['id', 'title']);

        return Inertia::render('Admin/Tests/Create', [
            'documents'   => $documents,
            'document_id' => $request->input('document_id', ''),
            'test'        => null,
        ]);
    }

    public function store(Request $request)
    {
        $request->merge([
            'document_id'  => $request->filled('document_id') ? $request->document_id : null,
            'time_limit'   => $request->filled('time_limit')  ? (int) $request->time_limit : null,
            'max_attempts' => $request->filled('max_attempts') ? (int) $request->max_attempts : 3,
        ]);

        $request->validate([
            'title'                            => ['required', 'string', 'max:255'],
            'document_id'                      => ['nullable', 'exists:documents,id'],
            'passing_score'                    => ['required', 'integer', 'min:1', 'max:100'],
            'time_limit'                       => ['nullable', 'integer', 'min:1'],
            'max_attempts'                     => ['required', 'integer', 'min:1', 'max:10'],
            'questions'                        => ['nullable', 'array'],
            'questions.*.text'                 => ['required_with:questions', 'string', 'max:1000'],
            'questions.*.type'                 => ['required_with:questions', 'in:single,multiple'],
            'questions.*.answers'              => ['nullable', 'array'],
            'questions.*.answers.*.text'       => ['required', 'string', 'max:500'],
            'questions.*.answers.*.is_correct' => ['boolean'],
        ]);

        $test = Test::create([
            'title'              => $request->title,
            'document_id'        => $request->document_id,
            'pass_percentage'    => $request->passing_score,
            'time_limit_minutes' => $request->time_limit,
            'max_attempts'       => $request->max_attempts,
            'is_active'          => true,
        ]);

        $this->syncQuestions($test, $request->questions ?? []);

        return redirect()->route('admin.tests.show', $test)->with('success', 'Тест создан.');
    }

    public function show(Test $test)
    {
        $test->load([
            'questions' => fn($q) => $q->where('is_active', true)->orderBy('order_number'),
            'questions.answers',
        ]);

        return Inertia::render('Admin/Tests/Show', compact('test'));
    }

    public function edit(Test $test)
    {
        $test->load([
            'questions' => fn($q) => $q->where('is_active', true)->orderBy('order_number'),
            'questions.answers',
        ]);
        $documents = Document::active()->orderBy('title')->get(['id', 'title']);

        return Inertia::render('Admin/Tests/Create', [
            'documents'   => $documents,
            'document_id' => '',
            'test'        => [
                'id'            => $test->id,
                'title'         => $test->title,
                'document_id'   => $test->document_id,
                'passing_score' => $test->pass_percentage,
                'time_limit'    => $test->time_limit_minutes,
                'max_attempts'  => $test->max_attempts ?? 3,
                'is_active'     => $test->is_active,
                'questions'     => $test->questions->map(fn($q) => [
                    'text'    => $q->question_text,
                    'type'    => $q->question_type,
                    'answers' => $q->answers->map(fn($a) => [
                        'text'       => $a->answer_text,
                        'is_correct' => (bool) $a->is_correct,
                    ])->toArray(),
                ])->toArray(),
            ],
        ]);
    }

    public function update(Request $request, Test $test)
    {
        $request->merge([
            'document_id'  => $request->filled('document_id') ? $request->document_id : null,
            'time_limit'   => $request->filled('time_limit')  ? (int) $request->time_limit : null,
            'max_attempts' => $request->filled('max_attempts') ? (int) $request->max_attempts : 3,
        ]);

        $request->validate([
            'title'                            => ['required', 'string', 'max:255'],
            'document_id'                      => ['nullable', 'exists:documents,id'],
            'passing_score'                    => ['required', 'integer', 'min:1', 'max:100'],
            'time_limit'                       => ['nullable', 'integer', 'min:1'],
            'max_attempts'                     => ['required', 'integer', 'min:1', 'max:10'],
            'is_active'                        => ['boolean'],
            'questions'                        => ['nullable', 'array'],
            'questions.*.text'                 => ['required_with:questions', 'string', 'max:1000'],
            'questions.*.type'                 => ['required_with:questions', 'in:single,multiple'],
            'questions.*.answers'              => ['nullable', 'array'],
            'questions.*.answers.*.text'       => ['required', 'string', 'max:500'],
            'questions.*.answers.*.is_correct' => ['boolean'],
        ]);

        $test->update([
            'title'              => $request->title,
            'document_id'        => $request->document_id,
            'pass_percentage'    => $request->passing_score,
            'time_limit_minutes' => $request->time_limit,
            'max_attempts'       => $request->max_attempts,
            'is_active'          => $request->boolean('is_active', $test->is_active),
        ]);

        // Деактивируем старые вопросы и создаём новые
        // (исторические AttemptAnswer записи сохраняют ссылки на старые question_id)
        $test->questions()->update(['is_active' => false]);
        $this->syncQuestions($test, $request->questions ?? []);

        return redirect()->route('admin.tests.show', $test)->with('success', 'Тест обновлён.');
    }

    public function destroy(Test $test)
    {
        $test->update(['is_active' => false]);

        return back()->with('success', 'Тест деактивирован.');
    }

    public function forceDestroy(Test $test)
    {
        $title = $test->title;
        $id    = $test->id;

        // Каскадное удаление через onDelete('cascade') в БД:
        // questions → answers, test_attempts → attempt_answers
        $test->delete();

        AuditLog::create([
            'user_id'     => auth()->id(),
            'user_name'   => auth()->user()->full_name,
            'action'      => 'delete',
            'model_type'  => 'Test',
            'model_id'    => $id,
            'ip_address'  => request()->ip(),
            'description' => "Удалён тест: {$title}",
            'created_at'  => now(),
        ]);

        return redirect()->route('admin.tests.index')
            ->with('success', "Тест «{$title}» удалён.");
    }

    private function syncQuestions(Test $test, array $questions): void
    {
        foreach ($questions as $qi => $qData) {
            $question = Question::create([
                'test_id'       => $test->id,
                'question_text' => $qData['text'],
                'question_type' => $qData['type'],
                'order_number'  => $qi + 1,
                'is_active'     => true,
            ]);

            foreach ($qData['answers'] ?? [] as $ai => $aData) {
                Answer::create([
                    'question_id'  => $question->id,
                    'answer_text'  => $aData['text'],
                    'is_correct'   => (bool) ($aData['is_correct'] ?? false),
                    'order_number' => $ai + 1,
                ]);
            }
        }
    }
}
