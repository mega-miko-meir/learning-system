<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Question;
use App\Models\Test;
use Illuminate\Http\Request;
use Inertia\Inertia;

class QuestionController extends Controller
{
    public function index(Test $test)
    {
        return Inertia::render('Admin/Questions/Index', [
            'test'      => $test,
            'questions' => $test->questions()->with('answers')->orderBy('order_number')->get(),
        ]);
    }

    public function create(Test $test)
    {
        return Inertia::render('Admin/Questions/Form', ['test' => $test, 'question' => null]);
    }

    public function store(Request $request, Test $test)
    {
        $data = $request->validate([
            'text'  => ['required', 'string'],
            'type'  => ['required', 'in:single,multiple'],
            'order' => ['nullable', 'integer'],
        ]);

        $test->questions()->create([
            'question_text' => $data['text'],
            'question_type' => $data['type'],
            'order_number'  => $data['order'] ?? 0,
        ]);

        return redirect()->route('admin.tests.show', $test)->with('success', 'Вопрос добавлен.');
    }

    public function show(Question $question)
    {
        return Inertia::render('Admin/Questions/Show', [
            'question' => $question->load('answers'),
        ]);
    }

    public function edit(Question $question)
    {
        return Inertia::render('Admin/Questions/Form', [
            'test'     => $question->test,
            'question' => $question->load('answers'),
        ]);
    }

    public function update(Request $request, Question $question)
    {
        $data = $request->validate([
            'text'  => ['required', 'string'],
            'type'  => ['required', 'in:single,multiple'],
            'order' => ['nullable', 'integer'],
        ]);

        $question->update([
            'question_text' => $data['text'],
            'question_type' => $data['type'],
            'order_number'  => $data['order'] ?? $question->order_number,
        ]);

        return redirect()->route('admin.tests.show', $question->test_id)->with('success', 'Вопрос обновлён.');
    }

    public function destroy(Question $question)
    {
        $testId = $question->test_id;
        $question->delete();

        return redirect()->route('admin.tests.show', $testId)->with('success', 'Вопрос удалён.');
    }
}
