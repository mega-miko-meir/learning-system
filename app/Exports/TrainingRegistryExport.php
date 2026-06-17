<?php

namespace App\Exports;

use App\Models\TrainingAssignment;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class TrainingRegistryExport implements FromQuery, WithHeadings, WithMapping, ShouldAutoSize, WithStyles, WithTitle
{
    private static array $trainingTypes = [
        'primary'   => 'Первичное',
        'periodic'  => 'Периодическое',
        'unplanned' => 'Внеплановое',
        'special'   => 'Специальное',
    ];

    private static array $statuses = [
        'pending'     => 'Ожидает',
        'in_progress' => 'В процессе',
        'completed'   => 'Выполнено',
        'failed'      => 'Не пройдено',
        'expired'     => 'Просрочено',
    ];

    public function __construct(
        private readonly ?int    $departmentId = null,
        private readonly ?string $status       = null,
        private readonly ?string $dateFrom     = null,
        private readonly ?string $dateTo       = null,
    ) {}

    public function query()
    {
        return TrainingAssignment::query()
            ->with(['user.department', 'user.position', 'document', 'testAttempts'])
            ->when($this->departmentId, fn($q) =>
                $q->whereHas('user', fn($u) => $u->where('department_id', $this->departmentId))
            )
            ->when($this->status, fn($q) => $q->where('status', $this->status))
            ->when($this->dateFrom, fn($q) => $q->whereDate('created_at', '>=', $this->dateFrom))
            ->when($this->dateTo,   fn($q) => $q->whereDate('created_at', '<=', $this->dateTo))
            ->latest();
    }

    public function headings(): array
    {
        return [
            '№',
            'ФИО сотрудника',
            'Подразделение',
            'Должность',
            'Вид обучения',
            'Документ',
            'Версия документа',
            'Статус',
            'Дата назначения',
            'Срок выполнения',
            'Дата завершения',
            'Время изучения (мин)',
            'Результат теста (%)',
            'Попыток пройдено',
        ];
    }

    public function map($row): array
    {
        static $i = 0;
        $i++;

        $bestScore = $row->testAttempts->where('finished_at', '!=', null)->max('score_percentage');

        return [
            $i,
            $row->user->full_name,
            $row->user->department?->name ?? '—',
            $row->user->position?->name   ?? '—',
            self::$trainingTypes[$row->training_type] ?? $row->training_type,
            $row->document->display_name,
            'v' . $row->document->version,
            self::$statuses[$row->status] ?? $row->status,
            $row->created_at->format('d.m.Y'),
            $row->due_date?->format('d.m.Y') ?? '—',
            $row->completed_at?->format('d.m.Y') ?? '—',
            $row->time_spent_seconds > 0 ? round($row->time_spent_seconds / 60, 1) : '—',
            $bestScore !== null ? $bestScore . '%' : '—',
            $row->testAttempts->whereNotNull('finished_at')->count(),
        ];
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
        return 'Реестр обучения';
    }
}
