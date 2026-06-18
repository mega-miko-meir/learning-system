<!DOCTYPE html>
<html lang="ru">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
body{font-family:Arial,sans-serif;background:#f5f7fa;margin:0;padding:20px}
.card{background:#fff;border-radius:12px;padding:32px;max-width:560px;margin:0 auto;box-shadow:0 2px 8px rgba(0,0,0,.08)}
.header{color:#1d4ed8;font-size:20px;font-weight:700;margin-bottom:16px}
.badge{display:inline-block;background:#dcfce7;color:#166534;padding:4px 12px;border-radius:20px;font-size:13px;margin-bottom:20px;font-weight:600}
table{width:100%;border-collapse:collapse;margin:16px 0}
td{padding:8px 0;border-bottom:1px solid #f1f5f9;font-size:14px}
td:first-child{color:#64748b;width:45%}
.creds{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:16px 0}
.creds p{margin:4px 0;font-size:14px;color:#374151}
.creds strong{color:#1e293b;font-size:15px}
.btn{display:inline-block;background:#1d4ed8;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;margin-top:20px}
.footer{margin-top:24px;font-size:12px;color:#94a3b8;text-align:center}
</style></head>
<body>
<div class="card">
    <div class="header">Добро пожаловать в систему обучения</div>
    <div class="badge">Аккаунт создан</div>
    <p style="color:#374151;font-size:15px">Здравствуйте, <strong>{{ $user->full_name }}</strong>!</p>
    <p style="color:#374151;font-size:14px">Для вас создан аккаунт в системе обучения персонала. Войдите по ссылке ниже, используя временный пароль.</p>

    <div class="creds">
        <p>Логин:&nbsp;
            <strong>{{ $user->email ?? $user->phone }}</strong>
        </p>
        <p>Временный пароль:&nbsp;<strong>{{ $tempPassword }}</strong></p>
    </div>

    <p style="color:#64748b;font-size:13px">При первом входе система попросит вас сменить пароль.</p>

    @if($user->position || $user->department)
    <table>
        @if($user->department)
        <tr><td>Отдел:</td><td>{{ $user->department->name }}</td></tr>
        @endif
        @if($user->position)
        <tr><td>Должность:</td><td>{{ $user->position->name }}</td></tr>
        @endif
    </table>
    @endif

    <a href="{{ route('login') }}" class="btn">Войти в систему</a>

    <div class="footer">{{ config('app.name') }} · Автоматическое уведомление</div>
</div>
</body>
</html>
