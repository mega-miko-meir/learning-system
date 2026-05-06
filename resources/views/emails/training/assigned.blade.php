<!DOCTYPE html>
<html lang="ru">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
body{font-family:Arial,sans-serif;background:#f5f7fa;margin:0;padding:20px}
.card{background:#fff;border-radius:12px;padding:32px;max-width:560px;margin:0 auto;box-shadow:0 2px 8px rgba(0,0,0,.08)}
.header{color:#1d4ed8;font-size:20px;font-weight:700;margin-bottom:16px}
.badge{display:inline-block;background:#dbeafe;color:#1d4ed8;padding:4px 12px;border-radius:20px;font-size:13px;margin-bottom:20px}
table{width:100%;border-collapse:collapse;margin:16px 0}
td{padding:8px 0;border-bottom:1px solid #f1f5f9;font-size:14px}
td:first-child{color:#64748b;width:45%}
.btn{display:inline-block;background:#1d4ed8;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;margin-top:20px}
.footer{margin-top:24px;font-size:12px;color:#94a3b8;text-align:center}
</style></head>
<body>
<div class="card">
    <div class="header">📋 Новое задание на обучение</div>
    <div class="badge">{{ \App\Models\TrainingAssignment::$trainingTypeLabels[$assignment->training_type] ?? $assignment->training_type }}</div>
    <p style="color:#374151;font-size:15px">Здравствуйте, <strong>{{ $assignment->user->full_name }}</strong>!</p>
    <p style="color:#374151;font-size:14px">Вам назначено обучение по следующему документу:</p>
    <table>
        <tr><td>Документ:</td><td><strong>{{ $assignment->document->title }}</strong></td></tr>
        <tr><td>Версия:</td><td>v{{ $assignment->document->version }}</td></tr>
        <tr><td>Срок выполнения:</td><td><strong>{{ $assignment->due_date?->format('d.m.Y') ?? 'Не указан' }}</strong></td></tr>
        <tr><td>Вид обучения:</td><td>{{ $assignment->training_type }}</td></tr>
    </table>
    <p style="color:#374151;font-size:14px">Для прохождения обучения войдите в систему через телефон и временный пароль.</p>
    <div class="footer">Система обучения персонала · Автоматическое уведомление</div>
</div>
</body>
</html>
