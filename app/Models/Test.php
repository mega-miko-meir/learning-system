<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Test extends Model
{
    use HasFactory;

    protected $fillable = [
        'document_id', 'title', 'pass_percentage',
        'max_attempts', 'time_limit_minutes', 'is_active',
    ];

    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }

    public function document()
    {
        return $this->belongsTo(Document::class);
    }

    public function questions()
    {
        return $this->hasMany(Question::class)->orderBy('order_number');
    }

    public function attempts()
    {
        return $this->hasMany(TestAttempt::class);
    }

    // Алиасы для совместимости с фронтенд-формами
    public function getPassingScoreAttribute(): int
    {
        return $this->pass_percentage;
    }

    public function getTimeLimitAttribute(): ?int
    {
        return $this->time_limit_minutes;
    }

    public function scopeActive(\Illuminate\Database\Eloquent\Builder $query): \Illuminate\Database\Eloquent\Builder
    {
        return $query->where('is_active', true);
    }
}
