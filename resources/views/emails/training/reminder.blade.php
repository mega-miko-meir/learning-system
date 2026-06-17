<!DOCTYPE html>
<html lang="ru">
<head><meta charset="UTF-8">
<style>
body{font-family:Arial,sans-serif;background:#f5f7fa;margin:0;padding:20px}
.card{background:#fff;border-radius:12px;padding:32px;max-width:560px;margin:0 auto;box-shadow:0 2px 8px rgba(0,0,0,.08)}
.header{color:#d97706;font-size:20px;font-weight:700;margin-bottom:16px}
.badge{display:inline-block;background:#fef3c7;color:#d97706;padding:4px 12px;border-radius:20px;font-size:13px;margin-bottom:20px}
table{width:100%;border-collapse:collapse;margin:16px 0}
td{padding:8px 0;border-bottom:1px solid #f1f5f9;font-size:14px}
td:first-child{color:#64748b;width:45%}
.footer{margin-top:24px;font-size:12px;color:#94a3b8;text-align:center}
</style></head>
<body>
<div class="card">
    <div class="header">⏰ Напоминание об обучении</div>
    <div class="badge">До срока осталось 7 дней</div>
    @if($recipientType === 'manager')
        <p style="color:#374151;font-size:15px">Уважаемый руководитель!</p>
        <p style="color:#374151;font-size:14px">Сотрудник <strong>{{ $assignment->user->full_name }}</strong> не завершил обучение, срок истекает через 7 дней.</p>
    @else
        <p style="color:#374151;font-size:15px">Здравствуйте, <strong>{{ $assignment->user->full_name }}</strong>!</p>
        <p style="color:#374151;font-size:14px">Напоминаем, что до срока прохождения обучения осталось <strong>7 дней</strong>.</p>
    @endif
    <table>
        <tr><td>Документ:</td><td><strong>{{ $assignment->document->display_name }}</strong></td></tr>
        @if($recipientType === 'manager')
        <tr><td>Сотрудник:</td><td>{{ $assignment->user->full_name }}</td></tr>
        @endif
        <tr><td>Срок:</td><td><strong style="color:#dc2626">{{ $assignment->due_date?->format('d.m.Y') }}</strong></td></tr>
        <tr><td>Статус:</td><td>{{ $assignment->status }}</td></tr>
    </table>
    <div class="footer">Система обучения персонала · Автоматическое уведомление</div>
</div>
</body>
</html>
