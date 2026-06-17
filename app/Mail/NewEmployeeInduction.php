<?php

namespace App\Mail;

use App\Models\TrainingAssignment;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class NewEmployeeInduction extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public User $employee, public TrainingAssignment $assignment) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Новый сотрудник: требуется первичный инструктаж сегодня',
        );
    }

    public function content(): Content
    {
        return new Content(view: 'emails.training.new-employee-induction');
    }
}
