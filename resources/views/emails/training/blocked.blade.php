<!DOCTYPE html>
<html lang="ru">
<head><meta charset="UTF-8">
<style>
body{font-family:Arial,sans-serif;background:#f5f7fa;margin:0;padding:20px}
.card{background:#fff;border-radius:12px;padding:32px;max-width:560px;margin:0 auto;box-shadow:0 2px 8px rgba(0,0,0,.08)}
.title{font-size:16px;font-weight:600;color:#111827;margin-bottom:4px}
.subtitle{font-size:13px;color:#6b7280;margin-bottom:24px}
table{width:100%;border-collapse:collapse;margin:0}
td{padding:8px 0;border-bottom:1px solid #f1f5f9;font-size:14px}
td:first-child{color:#6b7280;width:40%}
td:last-child{color:#111827}
.footer{margin-top:24px;font-size:12px;color:#9ca3af;text-align:center}
</style></head>
<body>
<div class="card">
    <p class="title">Уведомление о результате тестирования</p>
    <p class="subtitle">
        @if($recipientType === 'admin')
            Сотрудник не прошёл тест и исчерпал все попытки.
        @else
            Ваш подчинённый не прошёл тест и исчерпал все попытки.
        @endif
    </p>

    <table>
        <tr><td>Сотрудник</td><td><strong>{{ $assignment->user->full_name }}</strong></td></tr>
        <tr><td>Отдел</td><td>{{ $assignment->user->department?->name ?? '—' }}</td></tr>
        <tr><td>Должность</td><td>{{ $assignment->user->position?->name ?? '—' }}</td></tr>
        <tr><td>Документ</td><td>{{ $assignment->document->display_name }} (v{{ $assignment->document->version }})</td></tr>
        <tr><td>Вид обучения</td><td>{{ ['primary'=>'Первичное','periodic'=>'Периодическое','unplanned'=>'Внеплановое','special'=>'Специальное'][$assignment->training_type] ?? $assignment->training_type }}</td></tr>
        <tr><td>Дата</td><td>{{ now()->format('d.m.Y H:i') }}</td></tr>
    </table>

    <div class="footer">Система обучения персонала · Автоматическое уведомление</div>
</div>
</body>
</html>
