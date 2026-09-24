<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Document;
use App\Models\DocumentMaterial;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

// Материалы обучения без теста (первичный инструктаж): видеоролики и текстовые пункты (например, устный инструктаж).
class DocumentMaterialController extends Controller
{
    public function store(Request $request, Document $document)
    {
        if (!$document->isConfirmationMode()) {
            return back()->with('error', 'Материалы можно добавлять только к документам с режимом «Отметка без теста».');
        }

        $data = $request->validate([
            'kind'             => ['required', 'in:video,text'],
            'title'            => ['required', 'string', 'max:255'],
            'body'             => ['nullable', 'string', 'max:5000'],
            'is_required'      => ['boolean'],
            'duration_seconds' => ['nullable', 'integer', 'min:1', 'max:14400'],
            'file'             => ['required_if:kind,video', 'nullable', 'file', 'mimetypes:video/mp4,video/webm,video/quicktime', 'max:512000'],
        ], [
            'file.required_if' => 'Для видео нужно выбрать файл.',
            'file.mimetypes'   => 'Допустимые форматы видео: MP4, WebM, MOV.',
            'file.max'         => 'Видео не должно превышать 500 МБ.',
        ]);

        $path = null;
        if ($data['kind'] === DocumentMaterial::KIND_VIDEO) {
            $path = $request->file('file')->store('induction-videos', 'local');
        }

        $material = $document->materials()->create([
            'kind'             => $data['kind'],
            'title'            => $data['title'],
            'body'             => $data['kind'] === DocumentMaterial::KIND_TEXT ? ($data['body'] ?? null) : null,
            'file_path'        => $path,
            'duration_seconds' => $data['kind'] === DocumentMaterial::KIND_VIDEO ? ($data['duration_seconds'] ?? null) : null,
            'is_required'      => $request->boolean('is_required', true),
            'sort_order'       => ((int) $document->materials()->max('sort_order')) + 1,
        ]);

        $this->audit($request, 'create', $material, "Добавлен материал «{$material->title}» к документу {$document->display_name}");

        return back()->with('success', 'Материал добавлен.');
    }

    public function update(Request $request, DocumentMaterial $material)
    {
        $data = $request->validate([
            'title'       => ['required', 'string', 'max:255'],
            'body'        => ['nullable', 'string', 'max:5000'],
            'is_required' => ['boolean'],
            'sort_order'  => ['nullable', 'integer', 'min:0', 'max:65535'],
        ]);

        $material->update([
            'title'       => $data['title'],
            'body'        => $material->isVideo() ? null : ($data['body'] ?? null),
            'is_required' => $request->boolean('is_required', $material->is_required),
            'sort_order'  => $data['sort_order'] ?? $material->sort_order,
        ]);

        return back()->with('success', 'Материал обновлён.');
    }

    public function destroy(Request $request, DocumentMaterial $material)
    {
        $title = $material->title;
        $doc   = $material->document;

        if ($material->file_path) {
            Storage::disk('local')->delete($material->file_path);
        }
        $material->delete(); // прогресс просмотра удаляется каскадом

        $this->audit($request, 'delete', $material, "Удалён материал «{$title}» документа {$doc->display_name}");

        return back()->with('success', 'Материал удалён.');
    }

    // Предпросмотр видео администратором (у сотрудника — отдельный маршрут с проверкой назначения)
    public function preview(DocumentMaterial $material)
    {
        abort_if(!$material->isVideo() || !$material->file_path, 404);

        $path = Storage::disk('local')->path($material->file_path);
        abort_if(!file_exists($path), 404);

        return response()->file($path, [
            'Content-Type'           => match (strtolower(pathinfo($path, PATHINFO_EXTENSION))) {
                'webm'  => 'video/webm',
                'mov'   => 'video/quicktime',
                default => 'video/mp4',
            },
            'Cache-Control'          => 'private, no-transform',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }

    private function audit(Request $request, string $action, DocumentMaterial $material, string $description): void
    {
        AuditLog::create([
            'user_id'     => auth()->id(),
            'user_name'   => auth()->user()->full_name,
            'action'      => $action,
            'model_type'  => 'DocumentMaterial',
            'model_id'    => $material->id,
            'ip_address'  => $request->ip(),
            'description' => $description,
            'created_at'  => now(),
        ]);
    }
}
