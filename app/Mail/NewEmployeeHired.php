<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class NewEmployeeHired extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public User $employee, public User $creator) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Принят новый сотрудник: ' . $this->employee->full_name,
        );
    }

    public function content(): Content
    {
        return new Content(view: 'emails.hr.new-employee-hired');
    }
}
