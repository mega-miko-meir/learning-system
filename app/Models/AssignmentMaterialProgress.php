<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AssignmentMaterialProgress extends Model
{
    protected $table = 'assignment_material_progress';

    protected $fillable = [
        'assignment_id', 'material_id', 'max_position_seconds',
        'last_heartbeat_at', 'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'last_heartbeat_at' => 'datetime',
            'completed_at'      => 'datetime',
        ];
    }

    public function assignment()
    {
        return $this->belongsTo(TrainingAssignment::class, 'assignment_id');
    }

    public function material()
    {
        return $this->belongsTo(DocumentMaterial::class, 'material_id');
    }
}
