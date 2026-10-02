<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Document extends Model
{
    use HasFactory;

    protected $fillable = [
        'title', 'type', 'description', 'file_path',
        'version', 'is_active', 'uploaded_by', 'completion_mode',
    ];

    protected $appends = ['display_name'];

    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }

    // Название документа (description) — основное отображаемое имя везде в системе.
    // Код документа (title) используется как запасной вариант для старых записей без названия.
    public function getDisplayNameAttribute(): string
    {
        return $this->description ?: $this->title;
    }

    public function test()
    {
        return $this->hasOne(Test::class);
    }

    public function materials()
    {
        return $this->hasMany(DocumentMaterial::class)->orderBy('sort_order')->orderBy('id');
    }

    // Обучение без теста: просмотр видео + подтверждение ознакомления (например, первичный инструктаж).
    public function isConfirmationMode(): bool
    {
        return $this->completion_mode === 'confirmation';
    }

    // Три состояния по тесту, используются везде, где отображаются назначения/документы:
    // has_test — обычный документ с привязанным тестом (стандартное поведение, без пометок);
    // no_test_required — админ намеренно пометил «Без теста» (completion_mode=confirmation);
    // test_missing — документ должен иметь тест (completion_mode=test), но админ ещё не привязал его —
    // это ошибка конфигурации, а не осознанный выбор, сотрудника она не блокирует (см.
    // AssignmentController::heartbeat), но администратору её стоит показывать отдельно.
    // Требует предзагруженного отношения test (document.test), иначе будет лишний запрос.
    public function testStatus(): string
    {
        if ($this->isConfirmationMode()) {
            return 'no_test_required';
        }

        return $this->test ? 'has_test' : 'test_missing';
    }

    public function trainingMatrix()
    {
        return $this->hasMany(TrainingMatrix::class);
    }

    public function trainingAssignments()
    {
        return $this->hasMany(TrainingAssignment::class);
    }

    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    // Сортировка по отображаемому названию (то же значение, что display_name). Некоторые записи
    // хранят название в кавычках («...» или "..."), которые в SQL-сортировке идут раньше букв —
    // без нормализации такие документы выпадали в начало списка, а не на своё место по алфавиту.
    public function scopeOrderedByName($query)
    {
        return $query->orderByRaw(
            "TRIM(BOTH '»' FROM TRIM(BOTH '«' FROM TRIM(BOTH '\"' FROM COALESCE(NULLIF(description, ''), title)))) ASC"
        );
    }
}
