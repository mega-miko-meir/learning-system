<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Question extends Model
{
    use HasFactory;

    protected $fillable = [
        'test_id', 'question_text', 'question_type',
        'order_number', 'is_active',
    ];

    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }

    public function test()
    {
        return $this->belongsTo(Test::class);
    }

    public function answers()
    {
        return $this->hasMany(Answer::class)->orderBy('order_number');
    }

    // Alias used by controllers and views
    public function getTextAttribute(): string
    {
        return $this->question_text;
    }

    public function getTypeAttribute(): string
    {
        return $this->question_type;
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
