<?php

use App\Http\Controllers\Auth\AuthController;
use Illuminate\Support\Facades\Route;

// Корневой маршрут → редирект на логин
Route::get('/', fn () => redirect()->route('login'));

// ─── Публичные маршруты (только неавторизованным) ─────────────
Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
    Route::post('/login', [AuthController::class, 'login'])->name('login.post');
});

// ─── Авторизованные пользователи ──────────────────────────────
Route::middleware(['auth', 'user.active'])->group(function () {

    // Выход
    Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

    // Просмотр документов (inline PDF, без скачивания)
    Route::get('/documents/{document}/view', [\App\Http\Controllers\DocumentViewController::class, 'view'])->name('documents.view');

    // Смена пароля при первом входе
    Route::get('/change-password', [AuthController::class, 'showChangePassword'])->name('password.change');
    Route::post('/change-password', [AuthController::class, 'changePassword'])->name('password.change.post');

    // ─── Сотрудник ────────────────────────────────────────────
    Route::middleware('role:employee')->prefix('dashboard')->name('employee.')->group(function () {
        Route::get('/', [\App\Http\Controllers\Employee\DashboardController::class, 'index'])->name('dashboard');
        Route::get('/assignments', [\App\Http\Controllers\Employee\AssignmentController::class, 'index'])->name('assignments');
        Route::get('/assignments/{assignment}', [\App\Http\Controllers\Employee\AssignmentController::class, 'show'])->name('assignments.show');
        Route::post('/assignments/{assignment}/start', [\App\Http\Controllers\Employee\AssignmentController::class, 'start'])->name('assignments.start');
        Route::post('/assignments/{assignment}/heartbeat', [\App\Http\Controllers\Employee\AssignmentController::class, 'heartbeat'])->name('assignments.heartbeat');

        // Тестирование
        Route::get('/assignments/{assignment}/test', [\App\Http\Controllers\Employee\TestController::class, 'show'])->name('test.show');
        Route::post('/assignments/{assignment}/test/start', [\App\Http\Controllers\Employee\TestController::class, 'start'])->name('test.start');
        Route::post('/assignments/{assignment}/test/submit', [\App\Http\Controllers\Employee\TestController::class, 'submit'])->name('test.submit');
    });

    // ─── Руководитель ─────────────────────────────────────────
    Route::middleware('role:manager')->prefix('manager')->name('manager.')->group(function () {
        Route::get('/', [\App\Http\Controllers\Manager\DashboardController::class, 'index'])->name('dashboard');
        Route::get('/employees', [\App\Http\Controllers\Manager\EmployeeController::class, 'index'])->name('employees');
        Route::get('/employees/{user}', [\App\Http\Controllers\Manager\EmployeeController::class, 'show'])->name('employees.show');
        Route::get('/reports', [\App\Http\Controllers\Manager\ReportController::class, 'index'])->name('reports');
    });

    // ─── Суперадмин ───────────────────────────────────────────
    Route::middleware('role:superadmin')->prefix('superadmin')->name('superadmin.')->group(function () {
        Route::get('/', [\App\Http\Controllers\SuperAdmin\DashboardController::class, 'index'])->name('dashboard');

        // Управление пользователями и ролями
        Route::get('/users', [\App\Http\Controllers\SuperAdmin\UserController::class, 'index'])->name('users.index');
        Route::get('/users/create', [\App\Http\Controllers\SuperAdmin\UserController::class, 'create'])->name('users.create');
        Route::post('/users', [\App\Http\Controllers\SuperAdmin\UserController::class, 'store'])->name('users.store');
        Route::post('/users/{user}/role', [\App\Http\Controllers\SuperAdmin\UserController::class, 'changeRole'])->name('users.role');
        Route::post('/users/{user}/toggle', [\App\Http\Controllers\SuperAdmin\UserController::class, 'toggleActive'])->name('users.toggle');
    });

    // ─── Основной администратор ───────────────────────────────
    Route::middleware('role:admin')->prefix('admin')->name('admin.')->group(function () {
        Route::get('/', [\App\Http\Controllers\Admin\DashboardController::class, 'index'])->name('dashboard');

        // Сотрудники (admin тоже может управлять)
        Route::resource('users', \App\Http\Controllers\Admin\UserController::class);
        Route::post('/users/{user}/deactivate', [\App\Http\Controllers\Admin\UserController::class, 'deactivate'])->name('users.deactivate');
        Route::post('/users/{user}/activate', [\App\Http\Controllers\Admin\UserController::class, 'activate'])->name('users.activate');
        Route::post('/users/{user}/reset-password', [\App\Http\Controllers\Admin\UserController::class, 'resetPassword'])->name('users.reset-password');
        Route::post('/users/{user}/assign-training', [\App\Http\Controllers\Admin\UserController::class, 'assignTraining'])->name('users.assign-training');

        // Документы
        Route::resource('documents', \App\Http\Controllers\Admin\DocumentController::class);
        Route::post('/documents/{document}/new-version', [\App\Http\Controllers\Admin\DocumentController::class, 'uploadNewVersion'])->name('documents.new-version');

        // Матрица обучения
        Route::get('/matrix', [\App\Http\Controllers\Admin\MatrixController::class, 'index'])->name('matrix.index');
        Route::post('/matrix', [\App\Http\Controllers\Admin\MatrixController::class, 'store'])->name('matrix.store');
        Route::delete('/matrix/{matrix}', [\App\Http\Controllers\Admin\MatrixController::class, 'destroy'])->name('matrix.destroy');
        Route::post('/matrix/apply-all', [\App\Http\Controllers\Admin\MatrixController::class, 'applyToAll'])->name('matrix.apply-all');

        // Тесты
        Route::resource('tests', \App\Http\Controllers\Admin\TestController::class);
        Route::resource('tests.questions', \App\Http\Controllers\Admin\QuestionController::class)->shallow();
        Route::resource('questions.answers', \App\Http\Controllers\Admin\AnswerController::class)->shallow();
        Route::post('/questions/{question}/reorder-answers', [\App\Http\Controllers\Admin\AnswerController::class, 'reorder'])->name('admin.questions.reorder-answers');

        // Назначения обучения
        Route::get('/assignments', [\App\Http\Controllers\Admin\AssignmentController::class, 'index'])->name('assignments.index');
        Route::post('/assignments/assign-bulk', [\App\Http\Controllers\Admin\AssignmentController::class, 'assignBulk'])->name('assignments.bulk');
        Route::put('/assignments/{assignment}', [\App\Http\Controllers\Admin\AssignmentController::class, 'update'])->name('assignments.update');
        Route::post('/assignments/{assignment}/reset', [\App\Http\Controllers\Admin\AssignmentController::class, 'reset'])->name('assignments.reset');
        Route::delete('/assignments/{assignment}', [\App\Http\Controllers\Admin\AssignmentController::class, 'destroy'])->name('assignments.destroy');

        // Отделы и должности
        Route::resource('departments', \App\Http\Controllers\Admin\DepartmentController::class);
        Route::resource('positions', \App\Http\Controllers\Admin\PositionController::class);

        // Audit log
        Route::get('/audit', [\App\Http\Controllers\Admin\AuditController::class, 'index'])->name('audit.index');

        // Отчёты
        Route::get('/reports', [\App\Http\Controllers\Admin\ReportController::class, 'index'])->name('reports.index');
        Route::get('/reports/employee/{user}', [\App\Http\Controllers\Admin\ReportController::class, 'employee'])->name('reports.employee');
        Route::get('/reports/employee/{user}/pdf', [\App\Http\Controllers\Admin\ReportController::class, 'employeePdf'])->name('reports.employee.pdf');
        Route::get('/reports/department/{department}', [\App\Http\Controllers\Admin\ReportController::class, 'department'])->name('reports.department');
        Route::get('/reports/export', [\App\Http\Controllers\Admin\ReportController::class, 'export'])->name('reports.export');
    });

    // ─── HR Администратор ────────────────────────────────────
    Route::middleware('role:hr_admin')->prefix('hr')->name('hr.')->group(function () {
        Route::get('/', [\App\Http\Controllers\HR\DashboardController::class, 'index'])->name('dashboard');

        // Только управление сотрудниками
        Route::resource('users', \App\Http\Controllers\HR\UserController::class)->only(['index', 'create', 'store', 'show', 'edit', 'update']);
        Route::post('/users/{user}/deactivate', [\App\Http\Controllers\HR\UserController::class, 'deactivate'])->name('users.deactivate');
        Route::post('/users/{user}/activate', [\App\Http\Controllers\HR\UserController::class, 'activate'])->name('users.activate');
        Route::post('/users/{user}/reset-password', [\App\Http\Controllers\HR\UserController::class, 'resetPassword'])->name('users.reset-password');

        // Справочники (только просмотр)
        Route::get('/departments', [\App\Http\Controllers\HR\DepartmentController::class, 'index'])->name('departments.index');
        Route::get('/positions', [\App\Http\Controllers\HR\PositionController::class, 'index'])->name('positions.index');
    });
});
