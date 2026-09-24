<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DocumentMaterial extends Model
{
    public const KIND_VIDEO = 'video';
    public const KIND_TEXT  = 'text';

    protected $fillable = [
        'document_id', 'kind', 'title', 'body', 'file_path',
        'duration_seconds', 'sort_order', 'is_required',
    ];

    protected function casts(): array
    {
        return ['is_required' => 'boolean'];
    }

    public function document()
    {
        return $this->belongsTo(Document::class);
    }

    public function progress()
    {
        return $this->hasMany(AssignmentMaterialProgress::class, 'material_id');
    }

    public function isVideo(): bool
    {
        return $this->kind === self::KIND_VIDEO;
    }
}
