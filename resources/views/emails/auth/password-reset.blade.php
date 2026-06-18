<!DOCTYPE html>
<html lang="ru">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
body{font-family:Arial,sans-serif;background:#f5f7fa;margin:0;padding:20px}
.card{background:#fff;border-radius:12px;padding:32px;max-width:560px;margin:0 auto;box-shadow:0 2px 8px rgba(0,0,0,.08)}
.header{color:#1d4ed8;font-size:20px;font-weight:700;margin-bottom:16px}
.badge{display:inline-block;background:#fef3c7;color:#b45309;padding:4px 12px;border-radius:20px;font-size:13px;margin-bottom:20px;font-weight:600}
.creds{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:16px 0}
.creds p{margin:4px 0;font-size:14px;color:#374151}
.creds strong{color:#1e293b;font-size:15px}
.btn{display:inline-block;background:#1d4ed8;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;margin-top:20px}
.footer{margin-top:24px;font-size:12px;color:#94a3b8;text-align:center}
</style></head>
<body>
<div class="card">
    <div class="header">Пароль сброшен</div>
    <div class="badge">Требуется смена пароля</div>
    <p style="color:#374151;font-size:15px">Здравствуйте, <strong>{{ $user->full_name }}</strong>!</p>
    <p style="color:#374151;font-size:14px">Администратор сбросил ваш пароль. Войдите с новым временным паролем и сразу смените его.</p>

    <div class="creds">
        <p>Логин:&nbsp;
            <strong>{{ $user->email ?? $user->phone }}</strong>
        </p>
        <p>Новый временный пароль:&nbsp;<strong>{{ $tempPassword }}</strong></p>
    </div>

    <p style="color:#64748b;font-size:13px">Если вы не запрашивали сброс пароля — обратитесь к администратору.</p>

    <a href="{{ route('login') }}" class="btn">Войти в систему</a>

    <div class="footer">{{ config('app.name') }} · Автоматическое уведомление</div>
</div>
</body>
</html>
