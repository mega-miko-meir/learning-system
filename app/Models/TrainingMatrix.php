<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TrainingMatrix extends Model
{
    use HasFactory;

    protected $table = 'training_matrix';

    protected $fillable = [
        'position_id', 'document_id', 'training_type',
        'is_mandatory', 'is_active', 'required_reading_minutes', 'auto_assign',
    ];

    protected function casts(): array
    {
        return [
            'is_mandatory'             => 'boolean',
            'is_active'                => 'boolean',
            'auto_assign'              => 'boolean',
            'required_reading_minutes' => 'integer',
        ];
    }

    public function position()
    {
        return $this->belongsTo(Position::class);
    }

    public function document()
    {
        return $this->belongsTo(Document::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
