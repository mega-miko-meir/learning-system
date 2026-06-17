<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Document extends Model
{
    use HasFactory;

    protected $fillable = [
        'title', 'type', 'description', 'file_path',
        'version', 'is_active', 'uploaded_by',
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
}
