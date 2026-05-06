<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Answer;
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
            'text'       => ['required', 'string'],
            'is_correct' => ['boolean'],
        ]);

        $question->answers()->create([
            'answer_text' => $data['text'],
            'is_correct'  => $data['is_correct'] ?? false,
        ]);

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
            'answer'   => $answer,
        ]);
    }

    public function update(Request $request, Answer $answer)
    {
        $data = $request->validate([
            'text'       => ['required', 'string'],
            'is_correct' => ['boolean'],
        ]);

        $answer->load('question');
        $answer->update([
            'answer_text' => $data['text'],
            'is_correct'  => $data['is_correct'] ?? false,
        ]);

        // Axios-запрос с фронтенда — возвращаем JSON
        if (request()->wantsJson()) {
            return response()->json(['ok' => true]);
        }

        return redirect()->route('admin.tests.show', $answer->question->test_id)->with('success', 'Ответ обновлён.');
    }

    public function destroy(Answer $answer)
    {
        $testId = $answer->question->test_id;
        $answer->delete();

        return redirect()->route('admin.tests.show', $testId)->with('success', 'Ответ удалён.');
    }

    public function reorder(Request $request, \App\Models\Question $question)
    {
        $request->validate(['ids' => ['required', 'array']]);

        foreach ($request->ids as $index => $id) {
            $question->answers()->where('id', $id)->update(['order_number' => $index + 1]);
        }

        return response()->json(['ok' => true]);
    }
}
