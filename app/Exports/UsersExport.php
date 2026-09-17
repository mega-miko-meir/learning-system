<?php

namespace App\Exports;

use App\Models\User;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class UsersExport implements FromQuery, WithHeadings, WithMapping, ShouldAutoSize, WithStyles, WithTitle
{
    private static array $roleLabels = [
        'superadmin' => 'Системный администратор',
        'admin'      => 'Администратор',
        'hr_admin'   => 'HR-администратор',
        'manager'    => 'Руководитель',
        'employee'   => 'Сотрудник',
    ];

    public function __construct(
        private readonly ?int    $departmentId = null,
        private readonly ?string $role         = null,
        private readonly ?string $status       = null,
        private readonly bool    $excludeSuperadmin = true,
    ) {}

    public function query()
    {
        return User::query()
            ->with(['department', 'position', 'manager'])
            ->when($this->excludeSuperadmin, fn($q) => $q->where('role', '!=', 'superadmin'))
            ->when($this->departmentId, fn($q) => $q->where('department_id', $this->departmentId))
            ->when($this->role, fn($q) => $q->where('role', $this->role))
            ->when($this->status === 'inactive', fn($q) => $q->where('is_active', false))
            ->when($this->status === 'active', fn($q) => $q->active())
            ->orderBy('last_name');
    }

    public function headings(): array
    {
        return [
            '№',
            'ФИО',
            'Роль',
            'Отдел',
            'Должность',
            'Руководитель',
            'Телефон',
            'Email',
            'Статус',
            'Дата приёма',
            'Дата увольнения',
        ];
    }

    public function map($row): array
    {
        static $i = 0;
        $i++;

        return [
            $i,
            $row->full_name,
            self::$roleLabels[$row->role] ?? $row->role,
            $row->department?->name ?? '—',
            $row->position?->name   ?? '—',
            $row->manager?->full_name ?? '—',
            $row->phone ?? '—',
            $row->email ?? '—',
            $row->is_active ? 'Активен' : 'Неактивен',
            $row->hired_at?->format('d.m.Y') ?? '—',
            $row->fired_at?->format('d.m.Y') ?? '—',
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
        return 'Сотрудники';
    }
}
