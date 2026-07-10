<?php
declare(strict_types=1);

return [
    'allowed_origins' => [
        'https://blago-gorlovka-site.website.twcstorage.ru',
        'https://благовещение-горловка.рф',
        'https://www.благовещение-горловка.рф',
        'https://xn----7sbbbgbecqaa9a4adj1anib2bzn.xn--p1ai',
        'https://www.xn----7sbbbgbecqaa9a4adj1anib2bzn.xn--p1ai',
        'http://127.0.0.1:5173',
        'http://localhost:5173',
    ],
    'dry_run' => false,

    'telegram_bot_token' => '',
    'telegram_chat_id' => '-5589930019',
    'send_full_to_telegram' => true,

    // Use "smtp" for a Timeweb mailbox, "mail" for PHP mail(), or "auto".
    'mail_transport' => 'smtp',
    'smtp_host' => 'smtp.timeweb.ru',
    'smtp_port' => 465,
    'smtp_secure' => 'ssl',
    'smtp_user' => 'zapiski@xn----7sbbbgbecqaa9a4adj1anib2bzn.xn--p1ai',
    'smtp_pass' => '',
    'mail_from' => 'zapiski@xn----7sbbbgbecqaa9a4adj1anib2bzn.xn--p1ai',
    'mail_to' => '',
];
