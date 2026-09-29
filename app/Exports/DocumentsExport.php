<?php

namespace App\Exports;

use App\Models\Document;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class DocumentsExport implements FromQuery, WithEvents, WithHeadings, WithMapping, ShouldAutoSize, WithStyles, WithTitle
{
    // Короткие статусы для колонки «Тест» — те же формулировки и смысл, что бейджи в списке
    // документов на сайте, только тут не иконка/бейдж, а текст + заливка ячейки под цвет.
    private const TEST_STATUS_HAS = 'Есть';

    private const TEST_STATUS_NOT_REQUIRED = 'Тест не требуется';

    private const TEST_STATUS_MISSING = 'Нет теста';

    private const TEST_STATUS_COLORS = [
        self::TEST_STATUS_HAS => ['fill' => 'FFF0FDF4', 'font' => 'FF15803D'],          // зелёный
        self::TEST_STATUS_NOT_REQUIRED => ['fill' => 'FFF3F4F6', 'font' => 'FF6B7280'], // серый
        self::TEST_STATUS_MISSING => ['fill' => 'FFFFEDD5', 'font' => 'FFC2410C'],      // оранжевый
    ];
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

        $testInfo = match (true) {
            $row->test_exists => self::TEST_STATUS_HAS,
            $row->completion_mode === 'confirmation' => self::TEST_STATUS_NOT_REQUIRED,
            default => self::TEST_STATUS_MISSING,
        };

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

    // Заливка ячеек колонки «Тест» (F) под цвет статуса — визуальный аналог бейджа в Excel.
    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event) {
                $sheet = $event->sheet->getDelegate();
                $lastRow = $sheet->getHighestRow();

                for ($row = 2; $row <= $lastRow; $row++) {
                    $value = $sheet->getCell("F{$row}")->getValue();
                    $colors = self::TEST_STATUS_COLORS[$value] ?? null;
                    if (! $colors) {
                        continue;
                    }

                    $sheet->getStyle("F{$row}")->applyFromArray([
                        'font' => ['color' => ['argb' => $colors['font']], 'bold' => true],
                        'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['argb' => $colors['fill']]],
                        'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
                    ]);
                }
            },
        ];
    }
}
