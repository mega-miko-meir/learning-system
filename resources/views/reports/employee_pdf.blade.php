<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: DejaVu Sans, Arial, sans-serif; font-size: 11px; color: #1e293b; padding: 30px; }
.header { border-bottom: 3px solid #1d4ed8; padding-bottom: 16px; margin-bottom: 20px; }
.company { font-size: 13px; font-weight: bold; color: #1d4ed8; margin-bottom: 4px; }
.title { font-size: 18px; font-weight: bold; margin-bottom: 4px; }
.subtitle { color: #64748b; font-size: 11px; }
.section { margin-bottom: 20px; }
.section-title { font-size: 13px; font-weight: bold; color: #1d4ed8; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 10px; }
.info-grid { display: table; width: 100%; }
.info-row { display: table-row; }
.info-label { display: table-cell; width: 35%; color: #64748b; padding: 4px 0; }
.info-value { display: table-cell; font-weight: bold; padding: 4px 0; }
table.data { width: 100%; border-collapse: collapse; font-size: 10px; }
table.data th { background: #1d4ed8; color: #fff; padding: 7px 8px; text-align: left; font-weight: bold; }
table.data td { padding: 6px 8px; border-bottom: 1px solid #e2e8f0; }
table.data tr:nth-child(even) td { background: #f8fafc; }
.badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 9px; font-weight: bold; }
.badge-green { background: #d1fae5; color: #065f46; }
.badge-yellow { background: #fef3c7; color: #92400e; }
.badge-red { background: #fee2e2; color: #991b1b; }
.badge-gray { background: #f1f5f9; color: #475569; }
.stats { display: table; width: 100%; margin-bottom: 20px; }
.stat-box { display: table-cell; text-align: center; padding: 12px; border: 1px solid #e2e8f0; border-radius: 8px; }
.stat-num { font-size: 24px; font-weight: bold; color: #1d4ed8; }
.stat-label { font-size: 10px; color: #64748b; margin-top: 4px; }
.footer { margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 12px; color: #94a3b8; font-size: 9px; text-align: center; }
.progress-bar { background: #e2e8f0; border-radius: 4px; height: 8px; }
.progress-fill { background: #1d4ed8; border-radius: 4px; height: 8px; }
</style>
</head>
<body>
<div class="header">
    <div class="company">Система обучения персонала</div>
    <div class="title">Отчёт по обучению сотрудника</div>
    <div class="subtitle">Сформирован: {{ now()->format('d.m.Y H:i') }} · GxP Audit Trail</div>
</div>

{{-- Информация о сотруднике --}}
<div class="section">
    <div class="section-title">Сведения о сотруднике</div>
    <div class="info-grid">
        <div class="info-row">
            <div class="info-label">ФИО:</div>
            <div class="info-value">{{ $employee->full_name }}</div>
        </div>
        <div class="info-row">
            <div class="info-label">Подразделение:</div>
            <div class="info-value">{{ $employee->department?->name ?? '—' }}</div>
        </div>
        <div class="info-row">
            <div class="info-label">Должность:</div>
            <div class="info-value">{{ $employee->position?->name ?? '—' }}</div>
        </div>
        <div class="info-row">
            <div class="info-label">Руководитель:</div>
            <div class="info-value">{{ $employee->manager?->full_name ?? '—' }}</div>
        </div>
        <div class="info-row">
            <div class="info-label">Дата приёма:</div>
            <div class="info-value">{{ $employee->hired_at?->format('d.m.Y') ?? '—' }}</div>
        </div>
    </div>
</div>

{{-- Статистика --}}
<div class="section">
    <div class="section-title">Сводная статистика</div>
    <table width="100%" cellspacing="8">
        <tr>
            <td style="text-align:center;border:1px solid #e2e8f0;border-radius:8px;padding:10px">
                <div style="font-size:22px;font-weight:bold;color:#1d4ed8">{{ $total }}</div>
                <div style="font-size:10px;color:#64748b">Всего назначений</div>
            </td>
            <td style="text-align:center;border:1px solid #e2e8f0;border-radius:8px;padding:10px">
                <div style="font-size:22px;font-weight:bold;color:#065f46">{{ $completed }}</div>
                <div style="font-size:10px;color:#64748b">Выполнено</div>
            </td>
            <td style="text-align:center;border:1px solid #e2e8f0;border-radius:8px;padding:10px">
                <div style="font-size:22px;font-weight:bold;color:#92400e">{{ $pending }}</div>
                <div style="font-size:10px;color:#64748b">В процессе / Ожидает</div>
            </td>
            <td style="text-align:center;border:1px solid #e2e8f0;border-radius:8px;padding:10px">
                <div style="font-size:22px;font-weight:bold;color:#1d4ed8">{{ $percent }}%</div>
                <div style="font-size:10px;color:#64748b">Прогресс</div>
            </td>
        </tr>
    </table>
</div>

{{-- Детализация --}}
<div class="section">
    <div class="section-title">Детализация обучения</div>
    <table class="data">
        <thead>
            <tr>
                <th>Документ</th>
                <th>Версия</th>
                <th>Вид</th>
                <th>Статус</th>
                <th>Срок</th>
                <th>Завершено</th>
                <th>Результат</th>
            </tr>
        </thead>
        <tbody>
            @foreach($assignments as $a)
            <tr>
                <td>{{ $a->document->title }}</td>
                <td>v{{ $a->document->version }}</td>
                <td>{{ ['primary'=>'Первичное','periodic'=>'Периодическое','unplanned'=>'Внеплановое','special'=>'Специальное'][$a->training_type] ?? $a->training_type }}</td>
                <td>
                    @php $sc = ['completed'=>'badge-green','failed'=>'badge-red','pending'=>'badge-yellow','in_progress'=>'badge-yellow'][$a->status] ?? 'badge-gray' @endphp
                    @php $sl = ['completed'=>'Выполнено','failed'=>'Не пройдено','pending'=>'Ожидает','in_progress'=>'В процессе','expired'=>'Просрочено'][$a->status] ?? $a->status @endphp
                    <span class="badge {{ $sc }}">{{ $sl }}</span>
                </td>
                <td>{{ $a->due_date?->format('d.m.Y') ?? '—' }}</td>
                <td>{{ $a->completed_at?->format('d.m.Y') ?? '—' }}</td>
                <td>{{ $a->testAttempts->whereNotNull('finished_at')->max('score_percentage') !== null ? $a->testAttempts->whereNotNull('finished_at')->max('score_percentage').'%' : '—' }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>
</div>

<div class="footer">
    Документ сформирован автоматически системой управления обучением персонала.
    Дата создания: {{ now()->format('d.m.Y H:i:s') }}
</div>
</body>
</html>
