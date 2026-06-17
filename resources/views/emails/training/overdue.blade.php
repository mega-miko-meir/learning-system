<!DOCTYPE html>
<html lang="ru">
<head><meta charset="UTF-8">
<style>
body{font-family:Arial,sans-serif;background:#f5f7fa;margin:0;padding:20px}
.card{background:#fff;border-radius:12px;padding:32px;max-width:560px;margin:0 auto;box-shadow:0 2px 8px rgba(0,0,0,.08)}
.header{color:#dc2626;font-size:20px;font-weight:700;margin-bottom:16px}
.badge{display:inline-block;background:#fee2e2;color:#dc2626;padding:4px 12px;border-radius:20px;font-size:13px;margin-bottom:20px}
table{width:100%;border-collapse:collapse;margin:16px 0}
td{padding:8px 0;border-bottom:1px solid #f1f5f9;font-size:14px}
td:first-child{color:#64748b;width:45%}
.footer{margin-top:24px;font-size:12px;color:#94a3b8;text-align:center}
</style></head>
<body>
<div class="card">
    <div class="header">🚨 Эскалация: обучение просрочено</div>
    <div class="badge">Требуется ваше внимание</div>
    <p style="color:#374151;font-size:15px">Уважаемый руководитель!</p>
    <p style="color:#374151;font-size:14px">Сотрудник не завершил обязательное обучение в установленный срок.</p>
    <table>
        <tr><td>Сотрудник:</td><td><strong>{{ $assignment->user->full_name }}</strong></td></tr>
        <tr><td>Документ:</td><td>{{ $assignment->document->display_name }} (v{{ $assignment->document->version }})</td></tr>
        <tr><td>Срок был:</td><td><strong style="color:#dc2626">{{ $assignment->due_date?->format('d.m.Y') }}</strong></td></tr>
        <tr><td>Просрочено на:</td><td>{{ now()->diffInDays($assignment->due_date) }} дн.</td></tr>
        <tr><td>Отдел:</td><td>{{ $assignment->user->department?->name ?? '—' }}</td></tr>
    </table>
    <p style="color:#374151;font-size:14px">Пожалуйста, свяжитесь с сотрудником и обеспечьте прохождение обучения.</p>
    <div class="footer">Система обучения персонала · Автоматическое уведомление</div>
</div>
</body>
</html>
