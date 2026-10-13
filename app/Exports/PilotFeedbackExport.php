<?php

namespace App\Exports;

use App\Models\PilotFeedbackResponse;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

// Экспорт в «длинном» формате: одна строка = один вопрос одной анкеты
// (№ анкеты / дата / IP повторяются на каждой строке) — так удобно сортировать
// и фильтровать по вопросу или по ответу в самом Excel.
class PilotFeedbackExport implements FromCollection, WithHeadings, ShouldAutoSize, WithStyles, WithTitle
{
    public function collection(): Collection
    {
        $rows = collect();
        $n = 0;

        PilotFeedbackResponse::orderBy('created_at')->each(function (PilotFeedbackResponse $r) use ($rows, &$n) {
            $n++;
            $meta = [$n, $r->created_at->format('d.m.Y H:i'), $r->ip_address ?: '—'];

            $questions = [
                ['Насколько понятна навигация (оценка 1–5)', $r->nav_rating !== null ? $r->nav_rating . ' / 5' : '—', $r->nav_comment ?: ''],
                ['Были технические ошибки или сбои?', $r->had_issues ?: '—', $r->issue_description ?: ''],
                ['Таймер и кнопки работали как ожидалось?', $r->timer_buttons_ok ?: '—', $r->timer_buttons_comment ?: ''],
                ['Было понятно про повторные попытки теста?', $r->retry_clarity ?: '—', $r->retry_comment ?: ''],
                ['Что больше всего понравилось', $r->liked ?: '—', ''],
                ['Что вызвало наибольшие трудности', $r->difficulties ?: '—', ''],
                ['Пожелания и предложения', $r->suggestions ?: '—', ''],
            ];

            foreach ($questions as [$question, $answer, $comment]) {
                $rows->push([...$meta, $question, $answer, $comment]);
            }
        });

        return $rows;
    }

    public function headings(): array
    {
        return ['№ анкеты', 'Дата', 'IP-адрес', 'Вопрос', 'Ответ', 'Комментарий'];
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => [
                'font'      => ['bold' => true, 'color' => ['argb' => 'FFFFFFFF']],
                'fill'      => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['argb' => 'FF1D4ED8']],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
            ],
        ];
    }

    public function title(): string
    {
        return 'Отзывы о пилоте';
    }
}
