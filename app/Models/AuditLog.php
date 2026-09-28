<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'user_id', 'user_name', 'action', 'model_type', 'model_id',
        'old_values', 'new_values', 'ip_address', 'user_agent',
        'description', 'created_at',
    ];

    protected function casts(): array
    {
        return [
            'old_values' => 'array',
            'new_values' => 'array',
            'created_at' => 'datetime',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Единая точка записи в аудит — чтобы не дублировать user_id/ip/user_agent в каждом контроллере
    // и не забывать про них в новых. Используется всеми новыми вызовами аудита в контроллерах.
    public static function log(
        string $action,
        string $modelType,
        ?int $modelId,
        string $description,
        ?array $oldValues = null,
        ?array $newValues = null
    ): self {
        return static::create([
            'user_id' => auth()->id(),
            'user_name' => auth()->user()?->full_name,
            'action' => $action,
            'model_type' => $modelType,
            'model_id' => $modelId,
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'ip_address' => request()?->ip(),
            'user_agent' => request()?->userAgent(),
            'description' => $description,
            'created_at' => now(),
        ]);
    }
}
