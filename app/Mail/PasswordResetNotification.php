<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PasswordResetNotification extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public User $user,
        public string $tempPassword,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Пароль сброшен — ' . config('app.name'));
    }

    public function content(): Content
    {
        return new Content(view: 'emails.auth.password-reset');
    }
}
