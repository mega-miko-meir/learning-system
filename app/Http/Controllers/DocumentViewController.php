<?php

namespace App\Http\Controllers;

use App\Models\Document;
use App\Models\TrainingAssignment;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class DocumentViewController extends Controller
{
    public function view(Document $document)
    {
        abort_if(!$document->is_active, 404);

        $user = Auth::user();

        // Сотрудник может просматривать только документы, назначенные ему
        if ($user->isEmployee()) {
            $hasAssignment = TrainingAssignment::where('user_id', $user->id)
                ->where('document_id', $document->id)
                ->exists();
            abort_if(!$hasAssignment, 403);
        }

        $path = Storage::disk('public')->path($document->file_path);
        abort_if(!file_exists($path), 404);

        $mime = mime_content_type($path) ?: 'application/pdf';

        return response()->file($path, [
            'Content-Type'           => $mime,
            'Content-Disposition'    => 'inline; filename="document.pdf"',
            'X-Frame-Options'        => 'SAMEORIGIN',
            'Cache-Control'          => 'no-store, no-cache, must-revalidate',
            'Pragma'                 => 'no-cache',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }
}
