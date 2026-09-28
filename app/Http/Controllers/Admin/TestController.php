<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Answer;
use App\Models\AuditLog;
use App\Models\Document;
use App\Models\Question;
use App\Models\Test;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
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
                'document'        => $t->document?->display_name,
                'questions_count' => $t->questions()->where('is_active', true)->count(),
                'passing_score'   => $t->passing_score,
                'is_active'       => $t->is_active,
            ]);

        return Inertia::render('Admin/Tests/Index', compact('tests'));
    }

    public function create(Request $request)
    {
        $documents = Document::active()->orderBy('description')->get(['id', 'title', 'description', 'type', 'version']);

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

        if ($request->document_id) {
            $existing = Test::where('document_id', $request->document_id)->first();
            if ($existing) {
                if (!$request->boolean('force_replace')) {
                    return back()->withErrors(['document_conflict' => $existing->title])->withInput();
                }
                $existing->update(['document_id' => null]);
            }
        }

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
        $documents = Document::active()->orderBy('description')->get(['id', 'title', 'description', 'type', 'version']);

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

        if ($request->document_id) {
            $existing = Test::where('document_id', $request->document_id)->where('id', '!=', $test->id)->first();
            if ($existing) {
                if (!$request->boolean('force_replace')) {
                    return back()->withErrors(['document_conflict' => $existing->title])->withInput();
                }
                $existing->update(['document_id' => null]);
            }
        }

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

    public function parsePdf(Request $request): \Illuminate\Http\JsonResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'max:10240'],
        ]);

        $file      = $request->file('file');
        $extension = strtolower($file->getClientOriginalExtension());

        // Проверяем по расширению, а не по mimes:pdf,docx — у .docx нет уникальной MIME-сигнатуры
        // (это ZIP-архив), и finfo нередко определяет реальные .docx как обычный application/zip,
        // что ложно отклоняло бы корректные файлы.
        if (!in_array($extension, ['pdf', 'docx'], true)) {
            return response()->json([
                'error' => 'Поддерживаются только файлы PDF и Word (.docx).',
            ], 422);
        }

        try {
            $text = $extension === 'docx'
                ? $this->extractDocxText($file->getPathname())
                : $this->extractPdfText($file->getPathname());

            $lines     = array_values(array_filter(array_map('trim', explode("\n", $text))));
            $title     = '';
            $bodyStart = 0;

            if (!empty($lines) && !preg_match('/^\d+\./', $lines[0])) {
                $title     = $lines[0];
                $bodyStart = 1;
            }

            $body      = implode("\n", array_slice($lines, $bodyStart));
            $questions = $this->parseQuestionsFromText($body);

            if (empty($questions)) {
                return response()->json([
                    'error' => 'Вопросы не найдены. Убедитесь что файл соответствует шаблону.',
                ], 422);
            }

            return response()->json(['title' => $title, 'questions' => $questions]);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Не удалось прочитать файл: ' . $e->getMessage(),
            ], 422);
        }
    }

    private function extractPdfText(string $path): string
    {
        $parser = new \Smalot\PdfParser\Parser();
        $pdf    = $parser->parseFile($path);

        return str_replace(["\r\n", "\r"], "\n", $pdf->getText());
    }

    // .docx — это ZIP-архив; текст лежит в word/document.xml как <w:t>...</w:t> внутри <w:p>-параграфов.
    // Полноценный парсер (phpoffice/phpword) избыточен — нам нужен только простой текст для шаблона.
    private function extractDocxText(string $path): string
    {
        $zip = new \ZipArchive();
        if ($zip->open($path) !== true) {
            throw new \RuntimeException('не удалось открыть файл как .docx');
        }

        $xml          = $zip->getFromName('word/document.xml');
        $numberingXml = $zip->getFromName('word/numbering.xml'); // может отсутствовать, если списков нет
        $zip->close();

        if ($xml === false) {
            throw new \RuntimeException('файл повреждён или это не .docx');
        }

        $numFormats = $numberingXml !== false ? $this->parseDocxNumbering($numberingXml) : [];
        $counters   = [];

        preg_match_all('/<w:p\b.*?<\/w:p>/s', $xml, $paragraphs);

        $lines = [];
        foreach ($paragraphs[0] as $paragraphXml) {
            // Автонумерация Word (списки «1, 2, 3…» / «a, b, c…» из меню форматирования): сам номер
            // не хранится как текст — его рисует Word при отображении. Подставляем такой же
            // литеральный маркер («1.», «a)»), какого ждёт шаблон при вводе текста вручную или в PDF.
            $marker = '';
            if (preg_match('/<w:numPr>.*?<\/w:numPr>/s', $paragraphXml, $numPr)
                && preg_match('/<w:numId w:val="(\d+)"/', $numPr[0], $numIdM)) {
                $ilvl  = preg_match('/<w:ilvl w:val="(\d+)"/', $numPr[0], $ilvlM) ? $ilvlM[1] : '0';
                $numId = $numIdM[1];
                $fmt   = $numFormats[$numId][$ilvl] ?? null;

                if ($fmt) {
                    $key = "{$numId}:{$ilvl}";
                    $n   = ($counters[$key] ?? 0) + 1;
                    $counters[$key] = $n;

                    $marker = match ($fmt) {
                        'decimal'     => "{$n}. ",
                        'lowerLetter' => chr(96 + $n) . ') ',
                        'upperLetter' => chr(64 + $n) . ') ',
                        default       => '',
                    };
                }
            }

            $paragraphXml = preg_replace(['/<w:br\s*\/?>/', '/<w:tab\s*\/?>/'], ["\n", "\t"], $paragraphXml);
            $lines[] = $marker . strip_tags($paragraphXml);
        }

        return html_entity_decode(implode("\n", $lines), ENT_QUOTES | ENT_XML1, 'UTF-8');
    }

    // word/numbering.xml → [numId => [ilvl => numFmt]] (decimal/lowerLetter/upperLetter/...).
    private function parseDocxNumbering(string $xml): array
    {
        $abstractFormats = [];
        if (preg_match_all('/<w:abstractNum w:abstractNumId="(\d+)".*?<\/w:abstractNum>/s', $xml, $abstracts, PREG_SET_ORDER)) {
            foreach ($abstracts as $abstract) {
                if (preg_match_all('/<w:lvl w:ilvl="(\d+)".*?<w:numFmt w:val="(\w+)"/s', $abstract[0], $levels, PREG_SET_ORDER)) {
                    foreach ($levels as $level) {
                        $abstractFormats[$abstract[1]][$level[1]] = $level[2];
                    }
                }
            }
        }

        $result = [];
        if (preg_match_all('/<w:num w:numId="(\d+)"[^>]*>\s*<w:abstractNumId w:val="(\d+)"/s', $xml, $nums, PREG_SET_ORDER)) {
            foreach ($nums as $num) {
                if (isset($abstractFormats[$num[2]])) {
                    $result[$num[1]] = $abstractFormats[$num[2]];
                }
            }
        }

        return $result;
    }

    private function parseQuestionsFromText(string $text): array
    {
        $blocks = preg_split('/(?=^\d+\.)/m', $text);

        $questions = [];

        foreach ($blocks as $block) {
            $block = trim($block);
            if (empty($block) || !preg_match('/^\d+\./', $block)) {
                continue;
            }

            $lines = array_values(array_filter(
                array_map('trim', explode("\n", $block)),
                fn($l) => $l !== ''
            ));

            if (empty($lines)) continue;

            $questionLine = preg_replace('/^\d+\.\s*/', '', $lines[0]);

            $type = 'single';
            if (preg_match('/\[multiple\]/i', $questionLine)) {
                $type         = 'multiple';
                $questionLine = trim(preg_replace('/\[multiple\]/i', '', $questionLine));
            }

            $questionText = trim($questionLine);
            if (empty($questionText)) continue;

            $answers = [];
            for ($i = 1; $i < count($lines); $i++) {
                $line = $lines[$i];
                if (!preg_match('/^[a-zа-яёA-ZА-ЯЁ]\)\s*(.*)/u', $line, $match)) {
                    continue;
                }

                $answerText = trim($match[1]);
                $isCorrect  = false;

                if (str_ends_with($answerText, '*')) {
                    $isCorrect  = true;
                    $answerText = trim(rtrim($answerText, '* '));
                }

                if ($answerText !== '') {
                    $answers[] = ['text' => $answerText, 'is_correct' => $isCorrect];
                }
            }

            if (count($answers) >= 2) {
                $questions[] = [
                    'text'    => $questionText,
                    'type'    => $type,
                    'answers' => $answers,
                ];
            }
        }

        return $questions;
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
