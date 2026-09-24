<?php

// Переключатели функций. По умолчанию всё новое выключено — включается явной строкой в .env.
return [

    // Первичный инструктаж без теста (видео + подтверждение ознакомления).
    // Включить: FEATURE_INDUCTION=true в .env, затем php artisan config:clear (или config:cache на проде).
    'induction' => (bool) env('FEATURE_INDUCTION', false),

];
