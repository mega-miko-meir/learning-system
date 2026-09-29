<?php

namespace App\Exports;

use App\Models\Document;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class DocumentsExport implements FromQuery, WithHeadings, WithMapping, ShouldAutoSize, WithStyles, WithTitle
{
    public function __construct(
        private readonly ?string $search = null,
        private readonly bool $noTestOnly = false,
    ) {}

    public function query()
    {
        return Document::query()
            ->withExists('test')
            ->with('test:id,document_id,title')
            ->when($this->search, fn ($q, $s) => $q->where(
                fn ($q) => $q->where('title', 'like', "%$s%")->orWhere('description', 'like', "%$s%")
            ))
            ->when($this->noTestOnly, fn ($q) => $q->whereDoesntHave('test')->where('completion_mode', '!=', 'confirmation'))
            ->latest();
    }

    public function headings(): array
    {
        return [
            '№',
            'Код документа',
            'Название документа',
            'Тип документа',
            'Версия',
            'Тест',
            'Статус',
            'Дата добавления',
        ];
    }

    public function map($row): array
    {
        static $i = 0;
        $i++;

        $testInfo = $row->test_exists
            ? $row->test->title
            : ($row->completion_mode === 'confirmation' ? 'Без теста (ознакомление)' : 'Нет теста');

        return [
            $i,
            $row->title,
            $row->description,
            $row->type,
            'v'.$row->version,
            $testInfo,
            $row->is_active ? 'Активен' : 'Неактивен',
            $row->created_at->format('d.m.Y'),
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => [
                'font' => ['bold' => true, 'color' => ['argb' => 'FFFFFFFF']],
                'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['argb' => 'FF1D4ED8']],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
            ],
        ];
    }

    public function title(): string
    {
        return 'Документы';
    }
}
