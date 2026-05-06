<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Ежедневно в 08:00 — напоминания за 7 дней и эскалации
Schedule::command('training:send-reminders')->dailyAt('08:00');
