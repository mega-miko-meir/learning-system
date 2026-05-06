<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TrainingAssignment extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'document_id', 'matrix_id', 'training_type',
        'status', 'due_date', 'started_at', 'completed_at',
        'time_spent_seconds', 'required_reading_minutes',
    ];

    protected function casts(): array
    {
        return [
            'due_date'     => 'datetime',
            'started_at'   => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function document()
    {
        return $this->belongsTo(Document::class);
    }

    public function matrix()
    {
        return $this->belongsTo(TrainingMatrix::class);
    }

    public function testAttempts()
    {
        return $this->hasMany(TestAttempt::class, 'assignment_id');
    }

    public function scopePending(\Illuminate\Database\Eloquent\Builder $query): \Illuminate\Database\Eloquent\Builder
    {
        return $query->where('status', 'pending');
    }

    public function scopeCompleted(\Illuminate\Database\Eloquent\Builder $query): \Illuminate\Database\Eloquent\Builder
    {
        return $query->where('status', 'completed');
    }

    public function scopeFailed(\Illuminate\Database\Eloquent\Builder $query): \Illuminate\Database\Eloquent\Builder
    {
        return $query->where('status', 'failed');
    }

    public function scopeOverdue(\Illuminate\Database\Eloquent\Builder $query): \Illuminate\Database\Eloquent\Builder
    {
        return $query->whereIn('status', ['pending', 'in_progress'])
                     ->where('due_date', '<', now());
    }
}
