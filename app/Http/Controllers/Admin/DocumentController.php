<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Document;
use App\Models\TrainingAssignment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class DocumentController extends Controller
{
    public function index(Request $request)
    {
        $documents = Document::withExists('test')
            ->when($request->search, fn($q, $s) =>
                $q->where(fn($q) =>
                    $q->where('title', 'like', "%$s%")
                      ->orWhere('description', 'like', "%$s%")
                )
            )
            ->when($request->no_test, fn($q) =>
                $q->whereDoesntHave('test')
            )
            ->latest()
            ->paginate(20)
            ->withQueryString()
            ->through(fn($d) => [
                'id'          => $d->id,
                'title'       => $d->title,
                'description' => $d->description,
                'type'        => $d->type,
                'version'     => $d->version,
                'is_active'   => $d->is_active,
                'has_test'    => $d->test_exists,
                'created_at'  => $d->created_at->format('d.m.Y'),
            ]);

        return Inertia::render('Admin/Documents/Index', compact('documents'));
    }

    public function create()
    {
        return Inertia::render('Admin/Documents/Form', ['document' => null]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title'       => ['required', 'string', 'max:255'],
            'type'        => ['required', 'string'],
            'description' => ['required', 'string'],
            'version'     => ['required', 'integer', 'min:1', 'max:255'],
            'file'        => ['required', 'file', 'mimes:pdf,doc,docx', 'max:20480'],
        ]);

        $path = $request->file('file')->store('documents', 'public');
        $this->compressPdf($path);

        $document = Document::create([
            'title'       => $data['title'],
            'type'        => $data['type'],
            'description' => $data['description'],
            'file_path'   => $path,
            'version'     => $data['version'],
            'is_active'   => true,
            'uploaded_by' => auth()->id(),
        ]);

        AuditLog::create([
            'user_id'     => auth()->id(),
            'user_name'   => auth()->user()->full_name,
            'action'      => 'create',
            'model_type'  => 'Document',
            'model_id'    => $document->id,
            'ip_address'  => $request->ip(),
            'description' => "Загружен документ: {$document->display_name}",
            'created_at'  => now(),
        ]);

        return redirect()->route('admin.documents.show', $document)
            ->with('success', 'Документ загружен.');
    }

    public function show(Document $document)
    {
        $document->load('test:id,document_id,title,pass_percentage,is_active');

        return Inertia::render('Admin/Documents/Show', [
            'document' => $document,
            'test'     => $document->test ? [
                'id'    => $document->test->id,
                'title' => $document->test->title,
            ] : null,
        ]);
    }

    public function edit(Document $document)
    {
        return Inertia::render('Admin/Documents/Form', compact('document'));
    }

    public function update(Request $request, Document $document)
    {
        $data = $request->validate([
            'title'       => ['required', 'string', 'max:255'],
            'type'        => ['required', 'string'],
            'description' => ['required', 'string'],
            'version'     => ['required', 'integer', 'min:1', 'max:255'],
            'is_active'   => ['boolean'],
        ]);

        $document->update($data);

        AuditLog::create([
            'user_id'     => auth()->id(),
            'user_name'   => auth()->user()->full_name,
            'action'      => 'update',
            'model_type'  => 'Document',
            'model_id'    => $document->id,
            'ip_address'  => $request->ip(),
            'description' => "Обновлён документ: {$document->display_name}",
            'created_at'  => now(),
        ]);

        return redirect()->route('admin.documents.show', $document)
            ->with('success', 'Документ обновлён.');
    }

    public function destroy(Document $document)
    {
        $document->update(['is_active' => false]);

        AuditLog::create([
            'user_id'     => auth()->id(),
            'user_name'   => auth()->user()->full_name,
            'action'      => 'delete',
            'model_type'  => 'Document',
            'model_id'    => $document->id,
            'ip_address'  => request()->ip(),
            'description' => "Деактивирован документ: {$document->display_name}",
            'created_at'  => now(),
        ]);

        return back()->with('success', 'Документ деактивирован.');
    }

    public function forceDestroy(Document $document)
    {
        $title = $document->display_name;
        $id    = $document->id;

        // Каскадное удаление через onDelete('cascade') в БД:
        // test → questions → answers, training_assignments → test_attempts → attempt_answers, training_matrix
        $document->delete();

        AuditLog::create([
            'user_id'     => auth()->id(),
            'user_name'   => auth()->user()->full_name,
            'action'      => 'delete',
            'model_type'  => 'Document',
            'model_id'    => $id,
            'ip_address'  => request()->ip(),
            'description' => "Удалён документ: {$title}",
            'created_at'  => now(),
        ]);

        return redirect()->route('admin.documents.index')
            ->with('success', "Документ «{$title}» удалён.");
    }

    public function uploadNewVersion(Request $request, Document $document)
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:pdf,doc,docx', 'max:20480'],
        ]);

        $path = $request->file('file')->store('documents', 'public');
        $this->compressPdf($path);

        $document->update([
            'file_path' => $path,
            'version'   => $document->version + 1,
        ]);

        // GxP: при новой версии документа все сотрудники, у которых он был в матрице,
        // получают статус «Требуется повторное обучение» (pending)
        $reassigned = TrainingAssignment::where('document_id', $document->id)
            ->whereIn('status', ['completed', 'failed'])
            ->get();

        foreach ($reassigned as $assignment) {
            TrainingAssignment::create([
                'user_id'       => $assignment->user_id,
                'document_id'   => $document->id,
                'matrix_id'     => $assignment->matrix_id,
                'training_type' => 'unplanned',
                'status'        => 'pending',
                'due_date'      => now()->addDays(14),
                'required_reading_minutes' => $assignment->required_reading_minutes,
            ]);
        }

        AuditLog::create([
            'user_id'     => auth()->id(),
            'user_name'   => auth()->user()->full_name,
            'action'      => 'new_version',
            'model_type'  => 'Document',
            'model_id'    => $document->id,
            'ip_address'  => $request->ip(),
            'description' => "Загружена новая версия документа: {$document->display_name} (v{$document->version}). Переназначено обучений: {$reassigned->count()}",
            'created_at'  => now(),
        ]);

        return back()->with('success', "Загружена версия {$document->version}. Переназначено обучений: {$reassigned->count()}.");
    }

    // ─── PDF compression ─────────────────────────────────────────────────────

    private function compressPdf(string $storagePath): void
    {
        // Только PDF
        if (!str_ends_with(strtolower($storagePath), '.pdf')) {
            return;
        }

        $gs = $this->findGhostscript();
        if (!$gs) {
            return;
        }

        $original   = storage_path('app/public/' . $storagePath);
        $compressed = $original . '.tmp.pdf';

        try {
            $cmd = sprintf(
                '%s -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=/ebook'
                . ' -dNOPAUSE -dQUIET -dBATCH -sOutputFile=%s %s 2>/dev/null',
                escapeshellcmd($gs),
                escapeshellarg($compressed),
                escapeshellarg($original)
            );

            exec($cmd, $output, $exitCode);

            if ($exitCode === 0
                && file_exists($compressed)
                && filesize($compressed) > 0
                && filesize($compressed) < filesize($original)
            ) {
                rename($compressed, $original);
                Log::info("PDF compressed: {$storagePath} → " . round(filesize($original) / 1024) . ' KB');
            } elseif (file_exists($compressed)) {
                unlink($compressed);
            }
        } catch (\Throwable $e) {
            Log::warning('PDF compression failed: ' . $e->getMessage());
            if (file_exists($compressed)) {
                unlink($compressed);
            }
        }
    }

    private function findGhostscript(): ?string
    {
        foreach (['gs', 'gswin64c', 'gswin32c'] as $bin) {
            exec("which {$bin} 2>/dev/null", $out, $code);
            if ($code === 0 && !empty($out[0])) {
                return trim($out[0]);
            }
            $out = [];
        }
        return null;
    }
}
