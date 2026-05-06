<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TestAttempt extends Model
{
    use HasFactory;

    protected $fillable = [
        'assignment_id', 'user_id', 'test_id', 'attempt_number',
        'score_percentage', 'correct_answers', 'total_questions',
        'is_passed', 'is_blocked', 'started_at', 'finished_at',
    ];

    protected function casts(): array
    {
        return [
            'is_passed'    => 'boolean',
            'is_blocked'   => 'boolean',
            'started_at'   => 'datetime',
            'finished_at'  => 'datetime',
        ];
    }

    public function assignment()
    {
        return $this->belongsTo(TrainingAssignment::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function test()
    {
        return $this->belongsTo(Test::class);
    }

    public function attemptAnswers()
    {
        return $this->hasMany(AttemptAnswer::class, 'attempt_id');
    }
}
