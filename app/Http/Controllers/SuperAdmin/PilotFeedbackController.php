<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Exports\PilotFeedbackExport;
use App\Http\Controllers\Controller;
use App\Models\PilotFeedbackResponse;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

class PilotFeedbackController extends Controller
{
    public function index()
    {
        $responses = PilotFeedbackResponse::latest()
            ->paginate(20)
            ->through(fn ($r) => [
                'id' => $r->id,
                'ip_address' => $r->ip_address,
                'nav_rating' => $r->nav_rating,
                'nav_comment' => $r->nav_comment,
                'had_issues' => $r->had_issues,
                'issue_description' => $r->issue_description,
                'timer_buttons_ok' => $r->timer_buttons_ok,
                'timer_buttons_comment' => $r->timer_buttons_comment,
                'retry_clarity' => $r->retry_clarity,
                'retry_comment' => $r->retry_comment,
                'liked' => $r->liked,
                'difficulties' => $r->difficulties,
                'suggestions' => $r->suggestions,
                'created_at' => $r->created_at->format('d.m.Y H:i'),
            ]);

        return Inertia::render('SuperAdmin/PilotFeedback/Index', compact('responses'));
    }

    public function export()
    {
        $filename = 'pilot_feedback_' . now()->format('Ymd_His') . '.xlsx';

        return Excel::download(new PilotFeedbackExport, $filename);
    }
}
