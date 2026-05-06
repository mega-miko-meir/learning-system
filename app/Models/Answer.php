<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Answer extends Model
{
    use HasFactory;

    protected $fillable = [
        'question_id', 'answer_text', 'is_correct', 'order_number',
    ];

    protected function casts(): array
    {
        return ['is_correct' => 'boolean'];
    }

    public function question()
    {
        return $this->belongsTo(Question::class);
    }

    // Alias used by controllers and views
    public function getTextAttribute(): string
    {
        return $this->answer_text;
    }
}
