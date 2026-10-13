<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PilotFeedbackResponse extends Model
{
    protected $fillable = [
        'nav_rating', 'nav_comment',
        'had_issues', 'issue_description',
        'timer_buttons_ok', 'timer_buttons_comment',
        'retry_clarity', 'retry_comment',
        'liked', 'difficulties', 'suggestions',
    ];
}
