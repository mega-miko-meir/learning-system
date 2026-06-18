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
.badge-green  { background: #d1fae5; color: #065f46; }
.badge-yellow { background: #fef3c7; color: #92400e; }
.badge-red    { background: #fee2e2; color: #991b1b; }
.badge-gray   { background: #f1f5f9; color: #475569; }
.footer { margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 12px; color: #94a3b8; font-size: 9px; text-align: center; }
.employee-block { margin-bottom: 28px; page-break-inside: avoid; }
.employee-name { font-size: 12px; font-weight: bold; color: #1e293b; margin-bottom: 2px; }
.employee-meta { font-size: 10px; color: #64748b; margin-bottom: 8px; }
.summary-row-green { color: #065f46; font-weight: bold; }
.summary-row-red   { color: #991b1b; font-weight: bold; }
</style>
</head>
<body>

<div class="header">
    <div class="company">Система обучения персонала</div>
    <div class="title">Отчёт по обучению команды</div>
    <div class="subtitle">
        Руководитель: {{ $manager->full_name }} &nbsp;·&nbsp;
        Сотрудников: {{ $employees->count() }} &nbsp;·&nbsp;
        Сформирован: {{ now()->format('d.m.Y H:i') }}
    </div>
</div>

{{-- Сводная статистика по команде --}}
<div class="section">
    <div class="section-title">Сводная статистика по команде</div>
    <table width="100%" cellspacing="6">
        <tr>
            <td style="text-align:center;border:1px solid #e2e8f0;padding:10px;border-radius:6px">
                <div style="font-size:22px;font-weight:bold;color:#1d4ed8">{{ $employees->count() }}</div>
                <div style="font-size:10px;color:#64748b">Сотрудников</div>
            </td>
            <td style="text-align:center;border:1px solid #e2e8f0;padding:10px;border-radius:6px">
                <div style="font-size:22px;font-weight:bold;color:#1d4ed8">{{ $teamTotal }}</div>
                <div style="font-size:10px;color:#64748b">Всего назначений</div>
            </td>
            <td style="text-align:center;border:1px solid #e2e8f0;padding:10px;border-radius:6px">
                <div style="font-size:22px;font-weight:bold;color:#065f46">{{ $teamCompleted }}</div>
                <div style="font-size:10px;color:#64748b">Выполнено</div>
            </td>
            <td style="text-align:center;border:1px solid #e2e8f0;padding:10px;border-radius:6px">
                <div style="font-size:22px;font-weight:bold;color:#991b1b">{{ $teamOverdue }}</div>
                <div style="font-size:10px;color:#64748b">Просрочено</div>
            </td>
            <td style="text-align:center;border:1px solid #e2e8f0;padding:10px;border-radius:6px">
                <div style="font-size:22px;font-weight:bold;color:#1d4ed8">{{ $teamPercent }}%</div>
                <div style="font-size:10px;color:#64748b">Средний прогресс</div>
            </td>
        </tr>
    </table>
</div>

{{-- Сводная таблица по сотрудникам --}}
<div class="section">
    <div class="section-title">Прогресс по сотрудникам</div>
    <table class="data">
        <thead>
            <tr>
                <th>Сотрудник</th>
                <th>Должность</th>
                <th>Назначено</th>
                <th>Выполнено</th>
                <th>Просрочено</th>
                <th>Прогресс</th>
            </tr>
        </thead>
        <tbody>
            @foreach($employees as $e)
            <tr>
                <td style="font-weight:bold">{{ $e['user']->full_name }}</td>
                <td>{{ $e['user']->position?->name ?? '—' }}</td>
                <td style="text-align:center">{{ $e['total'] }}</td>
                <td style="text-align:center" class="{{ $e['completed'] > 0 ? 'summary-row-green' : '' }}">{{ $e['completed'] }}</td>
                <td style="text-align:center" class="{{ $e['overdue'] > 0 ? 'summary-row-red' : '' }}">{{ $e['overdue'] ?: '—' }}</td>
                <td style="text-align:center;font-weight:bold;color:#1d4ed8">{{ $e['percent'] }}%</td>
            </tr>
            @endforeach
        </tbody>
    </table>
</div>

{{-- Детализация по каждому сотруднику --}}
<div class="section">
    <div class="section-title">Детализация по сотрудникам</div>

    @foreach($employees as $e)
    <div class="employee-block">
        <div class="employee-name">{{ $e['user']->full_name }}</div>
        <div class="employee-meta">
            {{ $e['user']->position?->name ?? '—' }}
            &nbsp;·&nbsp; Выполнено: {{ $e['completed'] }}/{{ $e['total'] }}
            &nbsp;·&nbsp; Прогресс: {{ $e['percent'] }}%
            @if($e['overdue'] > 0)
            &nbsp;·&nbsp; <span style="color:#991b1b">Просрочено: {{ $e['overdue'] }}</span>
            @endif
        </div>

        @if($e['assignments']->count() > 0)
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
                @foreach($e['assignments'] as $a)
                <tr>
                    <td>{{ $a->document->display_name }}</td>
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
        @else
        <div style="font-size:10px;color:#94a3b8;padding:6px 0">Назначений нет</div>
        @endif
    </div>
    @endforeach
</div>

<div class="footer">
    Документ сформирован автоматически системой управления обучением персонала.
    Дата создания: {{ now()->format('d.m.Y H:i:s') }}
</div>
</body>
</html>
