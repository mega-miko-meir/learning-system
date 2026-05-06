<?php

namespace App\Mail;

use App\Models\TrainingAssignment;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class NewTrainingAssigned extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public TrainingAssignment $assignment) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Новое задание на обучение: ' . $this->assignment->document->title,
        );
    }

    public function content(): Content
    {
        return new Content(view: 'emails.training.assigned');
    }
}
