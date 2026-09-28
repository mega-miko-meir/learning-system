<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Answer;
use App\Models\AuditLog;
use App\Models\Question;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AnswerController extends Controller
{
    public function index(Question $question)
    {
        return Inertia::render('Admin/Answers/Index', [
            'question' => $question->load('answers'),
        ]);
    }

    public function create(Question $question)
    {
        return Inertia::render('Admin/Answers/Form', ['question' => $question, 'answer' => null]);
    }

    public function store(Request $request, Question $question)
    {
        $data = $request->validate([
            'text' => ['required', 'string'],
            'is_correct' => ['boolean'],
        ]);

        $answer = $question->answers()->create([
            'answer_text' => $data['text'],
            'is_correct' => $data['is_correct'] ?? false,
        ]);

        AuditLog::log('create', 'Answer', $answer->id, "Добавлен ответ к вопросу «{$question->question_text}»: {$answer->answer_text}".($answer->is_correct ? ' (правильный)' : ''));

        // Возвращаемся на страницу теста, а не вопроса (страница вопроса не используется)
        return redirect()->route('admin.tests.show', $question->test_id)->with('success', 'Ответ добавлен.');
    }

    public function show(Answer $answer)
    {
        return Inertia::render('Admin/Answers/Show', compact('answer'));
    }

    public function edit(Answer $answer)
    {
        return Inertia::render('Admin/Answers/Form', [
            'question' => $answer->question,
            'answer' => $answer,
        ]);
    }

    public function update(Request $request, Answer $answer)
    {
        $data = $request->validate([
            'text' => ['required', 'string'],
            'is_correct' => ['boolean'],
        ]);

        $answer->load('question');
        $oldText = $answer->answer_text;
        $oldIsCorrect = (bool) $answer->is_correct;
        $newIsCorrect = $data['is_correct'] ?? false;

        $answer->update([
            'answer_text' => $data['text'],
            'is_correct' => $newIsCorrect,
        ]);

        $description = "Изменён ответ «{$oldText}»";
        if ($oldIsCorrect !== $newIsCorrect) {
            $description .= $newIsCorrect ? ' — стал правильным' : ' — перестал быть правильным';
        }
        AuditLog::log(
            'update',
            'Answer',
            $answer->id,
            $description,
            ['answer_text' => $oldText, 'is_correct' => $oldIsCorrect],
            ['answer_text' => $answer->answer_text, 'is_correct' => $newIsCorrect]
        );

        // Axios-запрос с фронтенда — возвращаем JSON
        if (request()->wantsJson()) {
            return response()->json(['ok' => true]);
        }

        return redirect()->route('admin.tests.show', $answer->question->test_id)->with('success', 'Ответ обновлён.');
    }

    public function destroy(Answer $answer)
    {
        $testId = $answer->question->test_id;
        $text = $answer->answer_text;
        $answer->delete();

        AuditLog::log('delete', 'Answer', $answer->id, "Удалён ответ из теста #{$testId}: {$text}");

        return redirect()->route('admin.tests.show', $testId)->with('success', 'Ответ удалён.');
    }

    public function reorder(Request $request, Question $question)
    {
        $request->validate(['ids' => ['required', 'array']]);

        foreach ($request->ids as $index => $id) {
            $question->answers()->where('id', $id)->update(['order_number' => $index + 1]);
        }

        return response()->json(['ok' => true]);
    }
}
