<?php

namespace App\Http\Controllers;

use App\Models\PilotFeedbackResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PilotFeedbackController extends Controller
{
    public function create()
    {
        return Inertia::render('PilotFeedback/Create', [
            'submitted' => session('pilot_feedback_submitted', false),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'nav_rating' => 'nullable|integer|min:1|max:5',
            'nav_comment' => 'nullable|string|max:5000',
            'had_issues' => 'nullable|string|max:20',
            'issue_description' => 'nullable|string|max:5000',
            'timer_buttons_ok' => 'nullable|string|max:20',
            'timer_buttons_comment' => 'nullable|string|max:5000',
            'retry_clarity' => 'nullable|string|max:40',
            'retry_comment' => 'nullable|string|max:5000',
            'liked' => 'nullable|string|max:5000',
            'difficulties' => 'nullable|string|max:5000',
            'suggestions' => 'nullable|string|max:5000',
        ]);

        PilotFeedbackResponse::create($data);

        return redirect()->route('pilot-feedback.create')->with('pilot_feedback_submitted', true);
    }
}
