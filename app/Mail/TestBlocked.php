<?php

namespace App\Mail;

use App\Models\TrainingAssignment;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class TestBlocked extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public TrainingAssignment $assignment,
        public string             $recipientType // 'admin' | 'manager'
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Сотрудник заблокирован: ' . $this->assignment->user->full_name . ' — ' . $this->assignment->document->title,
        );
    }

    public function content(): Content
    {
        return new Content(view: 'emails.training.blocked');
    }
}
