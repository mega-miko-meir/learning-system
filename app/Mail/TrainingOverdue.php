<?php

namespace App\Mail;

use App\Models\TrainingAssignment;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class TrainingOverdue extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public TrainingAssignment $assignment) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'ПРОСРОЧЕНО: Обучение по «' . $this->assignment->document->display_name . '» — ' . $this->assignment->user->full_name,
        );
    }

    public function content(): Content
    {
        return new Content(view: 'emails.training.overdue');
    }
}
