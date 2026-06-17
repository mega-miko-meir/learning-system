<!DOCTYPE html>
<html lang="ru">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
body{font-family:Arial,sans-serif;background:#f5f7fa;margin:0;padding:20px}
.card{background:#fff;border-radius:12px;padding:32px;max-width:560px;margin:0 auto;box-shadow:0 2px 8px rgba(0,0,0,.08)}
.header{color:#1d4ed8;font-size:20px;font-weight:700;margin-bottom:16px}
.badge{display:inline-block;background:#fef3c7;color:#b45309;padding:4px 12px;border-radius:20px;font-size:13px;margin-bottom:20px;font-weight:600}
table{width:100%;border-collapse:collapse;margin:16px 0}
td{padding:8px 0;border-bottom:1px solid #f1f5f9;font-size:14px}
td:first-child{color:#64748b;width:45%}
.footer{margin-top:24px;font-size:12px;color:#94a3b8;text-align:center}
</style></head>
<body>
<div class="card">
    <div class="header">👤 Принят новый сотрудник</div>
    <div class="badge">Первичный инструктаж — сегодня</div>
    <p style="color:#374151;font-size:15px">Здравствуйте!</p>
    <p style="color:#374151;font-size:14px">В компанию принят новый сотрудник. Необходимо провести первичный инструктаж в день оформления.</p>
    <table>
        <tr><td>ФИО:</td><td><strong>{{ $employee->full_name }}</strong></td></tr>
        <tr><td>Отдел:</td><td>{{ $employee->department?->name ?? 'Не указан' }}</td></tr>
        <tr><td>Должность:</td><td>{{ $employee->position?->name ?? 'Не указана' }}</td></tr>
        <tr><td>Дата приёма:</td><td><strong>{{ $employee->hired_at?->format('d.m.Y') ?? now()->format('d.m.Y') }}</strong></td></tr>
        <tr><td>Документ инструктажа:</td><td>{{ $assignment->document->display_name }}</td></tr>
    </table>
    <p style="color:#374151;font-size:14px">Первичный инструктаж проводится день в день с оформлением сотрудника.</p>
    <div class="footer">Система обучения персонала · Автоматическое уведомление</div>
</div>
</body>
</html>
