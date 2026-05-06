<!DOCTYPE html>
<html lang="ru">
<head><meta charset="UTF-8">
<style>
body{font-family:Arial,sans-serif;background:#f5f7fa;margin:0;padding:20px}
.card{background:#fff;border-radius:12px;padding:32px;max-width:560px;margin:0 auto;box-shadow:0 2px 8px rgba(0,0,0,.08)}
.header{color:#dc2626;font-size:20px;font-weight:700;margin-bottom:16px}
.badge{display:inline-block;background:#fee2e2;color:#dc2626;padding:4px 12px;border-radius:20px;font-size:13px;margin-bottom:20px;font-weight:600}
table{width:100%;border-collapse:collapse;margin:16px 0}
td{padding:8px 0;border-bottom:1px solid #f1f5f9;font-size:14px}
td:first-child{color:#64748b;width:45%}
.footer{margin-top:24px;font-size:12px;color:#94a3b8;text-align:center}
.alert{background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:12px 16px;margin:16px 0;font-size:13px;color:#991b1b}
</style></head>
<body>
<div class="card">
    <div class="header">🚫 Сотрудник заблокирован после тестирования</div>
    <div class="badge">Использованы все попытки</div>

    @if($recipientType === 'admin')
    <p style="color:#374151;font-size:14px">Системное уведомление: сотрудник исчерпал все попытки прохождения теста.</p>
    @else
    <p style="color:#374151;font-size:14px">Уважаемый руководитель! Ваш подчинённый исчерпал все попытки прохождения теста.</p>
    @endif

    <div class="alert">
        Для разблокировки обратитесь к администратору системы обучения.
    </div>

    <table>
        <tr><td>Сотрудник:</td><td><strong>{{ $assignment->user->full_name }}</strong></td></tr>
        <tr><td>Отдел:</td><td>{{ $assignment->user->department?->name ?? '—' }}</td></tr>
        <tr><td>Должность:</td><td>{{ $assignment->user->position?->name ?? '—' }}</td></tr>
        <tr><td>Документ:</td><td>{{ $assignment->document->title }} (v{{ $assignment->document->version }})</td></tr>
        <tr><td>Вид обучения:</td><td>{{ ['primary'=>'Первичное','periodic'=>'Периодическое','unplanned'=>'Внеплановое','special'=>'Специальное'][$assignment->training_type] ?? $assignment->training_type }}</td></tr>
        <tr><td>Дата блокировки:</td><td>{{ now()->format('d.m.Y H:i') }}</td></tr>
    </table>

    <div class="footer">Система обучения персонала · Автоматическое уведомление</div>
</div>
</body>
</html>
