# CLAUDE.md — Руководство по проекту Learning System

> Этот файл читается Claude в начале каждой сессии. Обновляй его при значимых архитектурных изменениях.

---

## Стек технологий

| Слой | Технология |
|------|-----------|
| Backend | Laravel 12, PHP 8.2+ |
| Frontend | React 19, Inertia.js 3, Vite 7 |
| CSS | Tailwind CSS 4 |
| БД | MySQL (XAMPP), драйвер `database` |
| PDF | barryvdh/laravel-dompdf, pdfjs-dist |
| Excel | maatwebsite/excel |
| Маршруты в JS | tightenco/ziggy |
| DnD | @dnd-kit |

---

## Окружение (локальная разработка)

- **Сервер**: XAMPP, Apache + MySQL
- **URL**: `http://localhost:8000` (php artisan serve) или Apache на порту 80
- **БД**: `learning-system` (MySQL, user: root, no password)
- **Часовой пояс**: `Asia/Tashkent` (UTC+5) — задан в `.env` как `APP_TIMEZONE`
- **Очередь**: `QUEUE_CONNECTION=sync` — письма отправляются синхронно, queue worker не нужен
- **Почта**: Gmail SMTP (`smtp.gmail.com:587`), нужен App Password в `MAIL_PASSWORD`

---

## Команды

### Разработка
```bash
# Запустить всё сразу (сервер + vite + логи)
composer dev

# Только фронт (watch mode)
npm run dev

# Собрать фронт для продакшена
npm run build

# PHP-сервер отдельно
php artisan serve
```

### База данных
```bash
php artisan migrate                  # применить миграции
php artisan migrate:fresh --seed     # пересоздать + сиды
php artisan db:seed                  # только сиды
```

### Кэш и конфиг
```bash
php artisan config:clear             # ОБЯЗАТЕЛЬНО после изменения .env
php artisan cache:clear
php artisan route:clear
php artisan view:clear
```

### Тесты
```bash
composer test                        # config:clear + php artisan test
php artisan test                     # только тесты
php artisan test --filter=ExampleTest
php artisan pint                     # форматирование PHP (Laravel Pint)
```

### Полная первоначальная установка
```bash
composer setup   # install + .env + key + migrate + npm install + build
```

---

## Архитектура

### Роли пользователей

| Роль | Логин | Доступ |
|------|-------|--------|
| `superadmin` | email | Всё + управление ролями. Видит все аудит-записи |
| `admin` | email | Управление обучением, сотрудниками, отчётами. НЕ видит действия superadmin в аудите |
| `hr_admin` | email | Только управление сотрудниками и справочниками |
| `manager` | email | Свои сотрудники и их отчёты |
| `employee` | телефон | Прохождение обучения и тестов |

**Важно**: `EnsureRole` middleware позволяет `superadmin` доступ ко всем ролевым маршрутам. Все маршруты для `role:admin` доступны superadmin-у автоматически.

### Маршруты (`routes/web.php`)

```
/                    → редирект на /login
/login               → AuthController
/dashboard/*         → Employee (role:employee)
/manager/*           → Manager (role:manager)
/admin/*             → Admin (role:admin) — доступно и superadmin
/hr/*                → HR Admin (role:hr_admin)
/superadmin/*        → SuperAdmin (role:superadmin)
/documents/{id}/view → DocumentViewController (просмотр PDF, все роли)
```

### Структура папок

```
app/
├── Console/Commands/
│   └── SendTrainingReminders.php       # Artisan-команда для напоминаний
├── Exports/
│   └── TrainingRegistryExport.php      # Excel-экспорт реестра обучений
├── Http/
│   ├── Controllers/
│   │   ├── Admin/                      # Контроллеры для роли admin
│   │   │   ├── AssignmentController    # Назначения обучений
│   │   │   ├── AuditController         # Журнал аудита (скрывает superadmin от admin)
│   │   │   ├── DocumentController      # Документы + загрузка версий
│   │   │   ├── MatrixController        # Матрица обучения (должность→документ)
│   │   │   ├── ReportController        # Отчёты + PDF + Excel
│   │   │   ├── TestController          # CRUD тестов + вопросы/ответы одним запросом
│   │   │   └── UserController          # Сотрудники + авто-назначение обучения
│   │   ├── Auth/AuthController         # Вход, выход, смена пароля
│   │   ├── Employee/
│   │   │   ├── AssignmentController    # Просмотр назначений сотрудником
│   │   │   └── TestController          # Прохождение теста (start/submit)
│   │   ├── HR/                         # Аналог Admin но только для сотрудников
│   │   ├── Manager/                    # Просмотр своих сотрудников
│   │   ├── SuperAdmin/                 # Управление ролями
│   │   └── DocumentViewController      # Стриминг PDF (без скачивания)
│   └── Middleware/
│       ├── EnsureRole.php              # Проверка роли; superadmin проходит везде
│       ├── EnsureUserIsActive.php      # Блокировка деактивированных
│       └── HandleInertiaRequests.php   # Шаринг auth + flash в Inertia
├── Mail/                               # Mailable-классы для уведомлений
│   ├── NewTrainingAssigned             # Новое обучение назначено
│   ├── TestBlocked                     # Сотрудник провалил все попытки
│   ├── TrainingOverdue                 # Просрочено обучение
│   └── TrainingReminder               # Напоминание
└── Models/
    ├── User                            # Роли, полное имя, scopes: active/employees
    ├── Document                        # Документы; hasOne(Test)
    ├── Test                            # Тест: pass_percentage, max_attempts, time_limit_minutes
    ├── Question                        # is_active — деактивируются при редактировании теста
    ├── Answer                          # is_correct флаг
    ├── TrainingAssignment              # Назначение: статусы pending/in_progress/completed/failed/expired
    ├── TrainingMatrix                  # Матрица: position_id → document_id
    ├── TestAttempt                     # Попытка теста; attemptAnswers()
    ├── AttemptAnswer                   # Ответ на вопрос в рамках попытки
    └── AuditLog                        # Журнал действий

resources/js/
├── app.jsx                             # Точка входа Inertia
├── hooks/
│   └── useAuth.js                      # useAuth() и useFlash() из usePage().props
├── Layouts/
│   └── AppLayout.jsx                   # Единый layout: сайдбар + flash уведомления
│                                       # isActive логика через new URL(route(href)).pathname
├── Components/
│   ├── Pagination.jsx
│   └── PdfViewer.jsx                   # PDF через pdfjs-dist
└── Pages/
    ├── Admin/                          # Страницы для admin/superadmin
    │   ├── Assignments/Index           # Редактирование/сброс/удаление назначений
    │   ├── Documents/Show              # Карточка документа + блок теста
    │   ├── Reports/Employee            # Детальные результаты теста (раскрывающиеся)
    │   └── Tests/
    │       ├── Create.jsx              # Создание И редактирование (Microsoft Forms-стиль)
    │       └── Show.jsx                # Управление вопросами/ответами
    ├── Employee/
    │   ├── Assignments/Show            # Чтение документа + таймер + блокировка PDF
    │   └── Test/Show                   # Прохождение теста
    └── ...                             # HR, Manager, SuperAdmin, Auth
```

---

## Ключевые бизнес-правила

### Тестирование сотрудников
- Попытка теста создаётся **сервером при открытии страницы** (`TestController::show`), не через отдельный AJAX-вызов. `attempt_id` передаётся как Inertia-проп — кнопка "Сдать тест" активна сразу.
- Лимит попыток считается только по **завершённым проваленным** (`finished_at IS NOT NULL AND is_passed = 0`). Незавершённые попытки не расходуют лимит.
- При редактировании теста старые вопросы помечаются `is_active = false` (не удаляются!) — исторические `AttemptAnswer` сохраняют ссылки на старые `question_id`.
- `answers` в submit принимаются как `nullable` — пустая отправка не вызывает 422; в JS выводится confirm-диалог.

### Документы и PDF
- PDF виден сотруднику только пока статус назначения `pending` или `in_progress` **И** таймер ещё не истёк (`!unlocked`). После истечения таймера — PDF скрывается немедленно.
- После завершения обучения (`completed`/`failed`/`expired`) — `view_url: null` с сервера.

### Авто-назначение обучения
- Происходит автоматически при создании/смене должности сотрудника.
- Кнопка "Автоназначение обучения" на карточке сотрудника — для ручного запуска (если матрицу обновили позже).
- `required_reading_minutes` при авто-назначении устанавливается в 10 (по умолчанию).
- Дубли не создаются: проверка `whereNotIn('status', ['completed', 'failed', 'expired'])`.

### Блокировка при провале теста
- Если сотрудник исчерпал все попытки → email администратору и руководителю через `notifyBlocked()`.
- `notifyBlocked()` вызывается **после** обновления статуса назначения (иначе при ошибке SMTP статус не обновлялся бы).
- Обёрнут в `try-catch` с `Log::error` — SMTP-ошибки не ломают сдачу теста.

### Аудит-лог
- `admin` НЕ видит записи и пользователей с ролью `superadmin`.
- `superadmin` видит всё.

---

## Паттерны кода

### PHP / Laravel

**Данные для Inertia** — всегда через `->through()` или явный `->map()`, никогда не отдавать сырые Eloquent-модели на фронт:
```php
->through(fn($item) => [
    'id'    => $item->id,
    'title' => $item->title,
]);
```

**Email-уведомления** — всегда в `try-catch`, логировать ошибки:
```php
try {
    Mail::to($email)->queue(new SomeMail($data));
} catch (\Exception $e) {
    Log::error('Mail failed: ' . $e->getMessage());
}
```

**Загрузка только активных вопросов** (после редактирования теста старые деактивируются):
```php
$test->load([
    'questions' => fn($q) => $q->where('is_active', true)->orderBy('order_number'),
    'questions.answers',
]);
```

**Авто-назначение** (`assignTrainingByPosition`) — приватный хелпер в UserController, возвращает `int` (кол-во созданных назначений). Дублируется в `HR\UserController` — при изменении обновлять оба.

### React / Inertia

**Форма с вложенными данными** — не использовать `useForm` для сложных вложенных структур; вместо этого `useState` + `router.post/put`:
```jsx
router.post(route('...'), { questions: [...] }, {
    onError: (e) => setErrors(e),
    onFinish: () => setSubmitting(false),
});
```

**Активный пункт меню** — через реальный URL маршрута, не строковые манипуляции с именем:
```jsx
const routePath = new URL(route(href)).pathname.replace(/\/$/, "");
const currentPath = url.split("?")[0].replace(/\/$/, "");
const isActive = href.endsWith(".dashboard")
    ? currentPath === routePath
    : currentPath === routePath || currentPath.startsWith(routePath + "/");
```

**Инициализация `attemptId` из пропа** (не из AJAX после загрузки):
```jsx
const [attemptId, setAttemptId] = useState(attempt_id); // prop от сервера
```

**Flash-уведомления** — через `back()->with('success', '...')` в PHP; читаются через `useFlash()` в `AppLayout`.

---

## База данных — ключевые таблицы

| Таблица | Назначение |
|---------|-----------|
| `users` | Пользователи всех ролей |
| `departments` | Отделы |
| `positions` | Должности (принадлежат отделу) |
| `documents` | Учебные документы (PDF) |
| `training_matrix` | Матрица: какой документ для какой должности |
| `training_assignments` | Назначения обучения сотруднику |
| `tests` | Тесты, привязанные к документу |
| `questions` | Вопросы теста; `is_active` — при редактировании старые деактивируются |
| `answers` | Варианты ответов; `is_correct` |
| `test_attempts` | Попытки прохождения теста |
| `attempt_answers` | Ответы сотрудника в рамках попытки |
| `audit_logs` | Журнал всех действий |
| `sessions` | Сессии (driver: file) |

---

## История изменений (сессия июнь 2026 — продолжение 2)

### Фикс таймеров при навигации (Inertia history cache)

- **Баг таймера документа**: Inertia сохраняет исходные пропы (`status: pending`, `time_spent_seconds: 0`) в истории браузера. При нажатии «Назад» они восстанавливаются → `useEffect` сбрасывает таймер в 0.
- **Фикс**: в `Employee/Assignments/Show.jsx` после успешного `start()` добавлен `router.reload({ only: ['assignment'] })` — перезаписывает запись истории актуальным `status: in_progress`. Последующий возврат «Назад» больше не триггерит сброс.

- **Баг таймера теста**: `time_remaining` из Inertia history cache — устаревшее значение (от первого открытия). При возврате таймер стартовал не с актуального остатка.
- **Фикс**: в `Employee/Test/Show.jsx` хранится абсолютный дедлайн `test_deadline_${attempt_id}` в localStorage. `useState` вычисляет остаток как `(deadline - Date.now()) / 1000` — не зависит от серверных пропов. Дедлайн удаляется при успешной сдаче и "Попробовать снова".

### Фронтенд-поиск на страницах сотрудников

- **`Admin/Users/Index.jsx`** и **`HR/Users/Index.jsx`**: поле поиска теперь фильтрует `users.data` на фронте (ФИО, отдел, должность, email, телефон). Поиск мгновенный (без нажатия «Найти», без запроса на сервер). Пагинация скрывается при активном поиске. Счётчик «Найдено: N».
- Остальные фильтры (отдел, роль, статус) остались серверными — они фильтруют по всем записям в БД.

### Макет страницы теста

- `Employee/Test/Show.jsx` переведён на `fullHeight` AppLayout без `title` пропа.
- Единая компактная шапка (`shrink-0`): название теста + попытка + порог сдачи + таймер — не скроллится.
- Вопросы и кнопка «Сдать тест» — в `flex-1 overflow-y-auto`, скроллятся отдельно.
- Убран дублирующий `<h2>` с названием теста внутри контента.

---

## История изменений (сессия июнь 2026)

### Импорт тестов из PDF
- **Новая возможность**: кнопка "Импорт из PDF" в `Admin/Tests/Create.jsx` — загружаешь файл, вопросы появляются в форме.
- **Библиотека**: `smalot/pdfparser` (установлена через composer).
- **Маршрут**: `POST /admin/tests/parse-pdf` → `admin.tests.parse-pdf` → `Admin\TestController::parsePdf`.
- **Формат шаблона**: первая строка = название теста. Вопросы: `1. Текст?`, ответы: `a) Текст`, правильный: `*` в конце строки, множественный выбор: `[multiple]` в строке вопроса.
- **Парсер** (`parsePdfText`): разбивает текст по `^\d+\.`, извлекает тип и ответы. Нормализация переносов строк происходит в `parsePdf` до вызова парсера.

### Конфликт документа при привязке теста
- **Убрана** `Rule::unique` валидация на `document_id` в `store` и `update`.
- **Вместо ошибки** — бэкенд возвращает `back()->withErrors(['document_conflict' => $existingTest->title])`.
- **Фронт** показывает модальный диалог: "У документа уже есть тест «...». Заменить?".
- **При подтверждении** — повторный запрос с `force_replace: true` → старый тест открепляется (`document_id = null`), старый тест **не удаляется**.

### Фикс multiple-вопросов при сдаче теста
- **Баг**: `(int) $array` = `1` в PHP → несуществующий `answer_id` → FK violation → 500.
- **Фикс** в `Employee\TestController::submit`: раздельная обработка `single` и `multiple`.
- **Логика multiple**: вопрос верный только если выбраны **все** правильные варианты и **ни одного** лишнего.
- **`is_correct` в `AttemptAnswer`** для `multiple` хранит результат **всего вопроса**, не отдельного ответа.
- **Отчёт** (`Admin\UserController`): `attemptAnswers` группируются по `question_id` — одна строка на вопрос, ответы через запятую, `is_correct` берётся из первой записи группы.

### Мелкие улучшения
- **Нумерация вопросов** в `Create.jsx`: синий кружок заменён на текст `1.` серого цвета.

---

## История изменений (сессия июнь 2026 — продолжение)

### Таймер чтения и CSRF 419
- **Баг**: `sessionStorage.removeItem` на верхнем уровне `Employee/Assignments/Show.jsx` стирал прогресс при каждом рендере → при обновлении страницы таймер сбрасывался в 0. Исправлено: эти 3 строки удалены, сброс остался только в `useEffect([id, status, time_spent_seconds])`.
- **Ping keepalive**: `GET /ping` в `routes/web.php` + пинг каждые 4 мин в `Employee/Test/Show.jsx`. Предотвращает 419 при долгих тестах. При 419 — автоповтор submit.
- **Матрица обучения**: снята уникальность `(position_id, document_id)` → один документ можно назначить одной должности несколько раз. Чекбоксы для массового выбора должностей × документов.
- **Email при создании/сбросе пароля**: `AccountCreated` и `PasswordResetNotification` Mailable. Отправляется если есть `email`. В `.env` нужен `MAIL_MAILER=resend` + `RESEND_API_KEY`.
- **Resend вместо SMTP**: SMTP-порт 587 заблокирован на сервере → переход на Resend (HTTP API, порт 443). `config/mail.php` — `scheme` только через `env('MAIL_SCHEME')`, без fallback.

---

## История изменений (сессия апрель–май 2026)

### Тестирование сотрудников
- **Кнопка "Сдать тест"**: перенесли создание попытки из JS (`/test/start`) в PHP (`show()`). Кнопка активна мгновенно без ожидания AJAX.
- **Счётчик попыток**: `attempt_number` теперь возвращается из `/test/start` и обновляется в React-стейте при "Попробовать снова".
- **Валидация submit**: `answers` изменён с `required` на `nullable`; добавлен JS confirm если не все вопросы отвечены.
- **Ошибки submit**: улучшен `catch` — показывает HTTP-статус вместо "обновите страницу".
- **"Попробовать снова"**: фикс — теперь вызывает `startNewAttempt()` для создания новой попытки.

### Документы
- **PDF скрывается** как только истекает таймер чтения (`!unlocked`), а не только при статусе completed.
- **Документ без теста**: в списке документов — оранжевый бейдж "Нет теста" + подсветка строки. Фильтр "Только без теста".
- **Тест со страницы документа**: на карточке документа блок "Тест" — ссылка или кнопка "+ Создать тест" с предзаполненным `document_id`.

### Тесты
- **Единая форма create/edit** (`Admin/Tests/Create.jsx`): Microsoft Forms-стиль, все вопросы и ответы на одной странице, одна кнопка "Сохранить".
- **Валидация правильного ответа**: при сабмите проверяется что каждый вопрос имеет хотя бы один правильный вариант; карточка с ошибкой подсвечивается красной рамкой.
- **Редактирование теста**: старые вопросы деактивируются (`is_active = false`), создаются новые — история `AttemptAnswer` сохраняется.
- **`document_id` обязателен** при создании теста.

### Назначения обучения
- **CRUD на странице назначений**: редактирование (тип, срок, время изучения), сброс (для failed — даёт новую попытку, удаляет попытки теста), удаление.
- **Авто-назначение**: кнопка на карточке сотрудника + автоматически при создании/смене должности. `required_reading_minutes` теперь указывается явно (10 мин по умолчанию).

### Отчёты
- **Детальные результаты теста**: в отчёте сотрудника — раскрывающийся блок с каждой попыткой: вопрос / ответ / ✓✕.
- **Аудит**: `admin` не видит действия `superadmin`-ов (ни в логах, ни в фильтре пользователей).

### Интерфейс
- **Активный пункт меню**: исправлена сломанная логика. Теперь через `new URL(route(href)).pathname`.
- **Часовой пояс**: `Asia/Tashkent` (UTC+5) в `APP_TIMEZONE` и `config/app.php`.
- **Сессия**: `SESSION_LIFETIME=120` минут + `SESSION_EXPIRE_ON_CLOSE=true`.
- **Уведомления об ошибках submit**: убрана инструкция "обновите страницу".

### Email / очередь
- `QUEUE_CONNECTION=sync` — без queue worker, всё синхронно.
- `notifyBlocked()` вынесен **после** обновления статуса и обёрнут в `try-catch`.
- Gmail SMTP: нужен `MAIL_USERNAME` и `MAIL_PASSWORD` (App Password) в `.env`.

---

## Известные особенности и ловушки

1. **Не запускать queue worker**: `QUEUE_CONNECTION=sync`, письма отправляются синхронно. Запуск `queue:work` приведёт к двойной обработке.

2. **После изменения `.env` — всегда `php artisan config:clear`**.

3. **IDE-предупреждения Intelephense P1013** (`Undefined method 'id'` на `auth()->id()`) — ложные срабатывания, код работает корректно.

4. **Два контроллера с `assignTrainingByPosition`**: `Admin\UserController` и `HR\UserController`. При изменении логики — обновлять оба.

5. **Вопросы теста**: при редактировании через форму старые помечаются `is_active=false`, создаются новые. В `Employee/TestController::show` и `Admin/TestController::show` загружаются только `where('is_active', true)`.

6. **`Form.jsx` в Tests** больше не используется для создания — только для совместимости (если кто-то зайдёт на старый URL edit). `Create.jsx` обрабатывает оба режима.

7. **PDF-просмотрщик** (`PdfViewer.jsx`): использует `pdfjs-dist`. Загрузка через `route('documents.view', id)` — стриминг без прямой ссылки на файл.

8. **Ziggy**: маршруты доступны в JS через глобальный `route()`. Генерируются автоматически при `npm run build`. Если добавил новый маршрут — пересобери фронт.

9. **`multiple` вопросы в отчёте**: `AttemptAnswer` хранит одну запись на каждый выбранный ответ. `is_correct` = результат всего вопроса (не отдельного ответа). В отчёте группировать по `question_id`, иначе один вопрос покажется несколько раз.

10. **Конфликт `document_id` у теста**: уникальность не через `Rule::unique` в валидации, а вручную с диалогом замены. `force_replace: true` в запросе → откреплять старый тест, не удалять.

11. **Таймер чтения в `Employee/Assignments/Show.jsx`**: код сброса `sessionStorage` должен быть **только в `useEffect`** с зависимостями `[id, status, time_spent_seconds]`. Нельзя ставить `sessionStorage.removeItem` на верхний уровень компонента — он выполняется при каждом рендере (каждую секунду тика), что стирает сохранённый прогресс и сбрасывает таймер при обновлении страницы.

12. **Keepalive для сессии (CSRF 419)**: маршрут `GET /ping` → `response()->noContent()` добавлен в `routes/web.php`. В `Employee/Test/Show.jsx` пингуется каждые 4 минуты через `window.axios.get(route('ping'))`. При 419 на сдаче теста — автоматически пингует и повторяет submit. В `Employee/Assignments/Show.jsx` роль keepalive выполняют heartbeat-запросы каждые 10 секунд.

13. **Inertia history cache сбрасывает таймер чтения**: Inertia сохраняет исходные пропы страницы в истории браузера (до того как `start()` обновил статус на сервере). При нажатии «Назад» восстанавливаются `status: pending, time_spent_seconds: 0`, и `useEffect` сбрасывает таймер. **Фикс**: после успешного `start()` вызвать `router.reload({ only: ['assignment'] })` — обновляет запись истории актуальными данными (`status: in_progress`).

14. **Таймер теста и Inertia history cache**: `time_remaining` из Inertia history — устаревшее значение (от момента первого открытия). При возврате назад таймер инициализируется старым значением вместо актуального. **Фикс**: хранить абсолютный дедлайн в localStorage (`test_deadline_${attempt_id}`). На каждом монтировании вычислять остаток как `(deadline - Date.now()) / 1000`. Дедлайн устанавливается один раз при первом открытии попытки, удаляется после успешной сдачи и при "Попробовать снова".

15. **Деплой на прод**: изменения в JS-файлах вступают в силу только после `npm run build` на сервере. После `git pull` на проде всегда запускать `npm run build`. Без этого прод работает на старом бандле.

16. **Фронтенд-поиск с пагинацией**: при активном поиске скрывать `<Pagination>` — пагинация работает на стороне сервера и не знает о фронтенд-фильтре. Паттерн: `const q = search.trim().toLowerCase(); const visibleRows = q ? data.filter(...) : data;`, и `{!q && <Pagination ... />}`.
