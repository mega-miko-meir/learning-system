<?php

namespace App\Exports;

use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class MatrixExport implements FromCollection, WithHeadings, WithMapping, ShouldAutoSize, WithStyles, WithTitle
{
    private const TRAINING_TYPE_LABELS = [
        'primary' => 'Первичное',
        'periodic' => 'Периодическое',
        'unplanned' => 'Внеплановое',
        'special' => 'Специальное',
    ];

    public function __construct(private readonly Collection $rows) {}

    public function collection(): Collection
    {
        return $this->rows;
    }

    public function headings(): array
    {
        return [
            '№',
            'Отдел',
            'Должность',
            'Код документа',
            'Название документа',
            'Вид обучения',
            'Время изучения (мин)',
            'Обязательное',
            'Дата создания',
        ];
    }

    public function map($row): array
    {
        static $i = 0;
        $i++;

        return [
            $i,
            $row->position->department?->name ?? '—',
            $row->position->name,
            $row->document->title,
            $row->document->display_name,
            self::TRAINING_TYPE_LABELS[$row->training_type] ?? $row->training_type,
            $row->required_reading_minutes,
            $row->is_mandatory ? 'Да' : 'Нет',
            $row->created_at?->format('d.m.Y H:i') ?? '—',
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
        return 'Матрица обучения';
    }
}
