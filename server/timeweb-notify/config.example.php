<?php
declare(strict_types=1);

return [
    'allowed_origins' => [
        'https://pehal16.github.io',
        'https://blago-gorlovka-site.website.twcstorage.ru',
        'https://благовещение-горловка.рф',
        'https://www.благовещение-горловка.рф',
        'https://xn----7sbbbgbecqaa9a4adj1anib2bzn.xn--p1ai',
        'https://www.xn----7sbbbgbecqaa9a4adj1anib2bzn.xn--p1ai',
        'https://api.благовещение-горловка.рф',
        'https://api.xn----7sbbbgbecqaa9a4adj1anib2bzn.xn--p1ai',
        'http://127.0.0.1:5173',
        'http://localhost:5173',
    ],
    'dry_run' => false,

    'telegram_bot_token' => '',
    'telegram_chat_id' => '-5589930019',
    'send_full_to_telegram' => true,

    // Email is intentionally disabled for the first launch.
    'mail_transport' => 'disabled',
    'smtp_host' => '',
    'smtp_port' => 465,
    'smtp_secure' => 'ssl',
    'smtp_user' => '',
    'smtp_pass' => '',
    'mail_from' => '',
    'mail_to' => '',
];
