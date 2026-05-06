<?php

namespace App\Console\Commands;

use App\Mail\TrainingOverdue;
use App\Mail\TrainingReminder;
use App\Models\TrainingAssignment;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

class SendTrainingReminders extends Command
{
    protected $signature   = 'training:send-reminders';
    protected $description = 'Отправляет напоминания (за 7 дней) и эскалации (просрочено)';

    public function handle(): void
    {
        $this->sendReminders();
        $this->sendEscalations();
        $this->info('Готово.');
    }

    private function sendReminders(): void
    {
        $assignments = TrainingAssignment::with(['user.manager', 'document'])
            ->whereIn('status', ['pending', 'in_progress'])
            ->whereNotNull('due_date')
            ->whereDate('due_date', now()->addDays(7)->toDateString())
            ->get();

        foreach ($assignments as $a) {
            if ($a->user->email) {
                Mail::to($a->user->email)->queue(new TrainingReminder($a, 'employee'));
            }
            if ($a->user->manager?->email) {
                Mail::to($a->user->manager->email)->queue(new TrainingReminder($a, 'manager'));
            }
        }
        $this->line("  Напоминаний: {$assignments->count()} назначений");
    }

    private function sendEscalations(): void
    {
        $overdue = TrainingAssignment::with(['user.manager', 'document'])
            ->whereIn('status', ['pending', 'in_progress'])
            ->whereNotNull('due_date')
            ->where('due_date', '<', now())
            ->get();

        $sent = 0;
        foreach ($overdue as $a) {
            if ($a->user->manager?->email) {
                Mail::to($a->user->manager->email)->queue(new TrainingOverdue($a));
                $sent++;
            }
        }
        $this->line("  Эскалаций отправлено: {$sent}");
    }
}
