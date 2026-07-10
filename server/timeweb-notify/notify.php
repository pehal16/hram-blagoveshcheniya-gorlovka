<?php
declare(strict_types=1);

const MAX_MESSAGE_LENGTH = 3900;

function default_config(): array
{
    return [
        'allowed_origins' => ['*'],
        'dry_run' => false,

        'telegram_bot_token' => '',
        'telegram_chat_id' => '',
        'send_full_to_telegram' => true,

        'mail_transport' => 'auto',
        'smtp_host' => '',
        'smtp_port' => 465,
        'smtp_secure' => 'ssl',
        'smtp_user' => '',
        'smtp_pass' => '',
        'mail_from' => '',
        'mail_to' => '',
    ];
}

function load_config(): array
{
    $paths = [];
    $envPath = getenv('TIMEWEB_NOTIFY_CONFIG');

    if (is_string($envPath) && $envPath !== '') {
        $paths[] = $envPath;
    }

    $paths[] = __DIR__ . '/config.php';
    $paths[] = __DIR__ . '/notify-config.php';
    $paths[] = dirname(__DIR__) . '/notify-config.php';

    $config = default_config();

    foreach ($paths as $path) {
        if (!is_string($path) || !is_file($path)) {
            continue;
        }

        $loaded = require $path;

        if (!is_array($loaded)) {
            continue;
        }

        return array_replace($config, $loaded);
    }

    return $config;
}

function config_bool(array $config, string $key): bool
{
    $value = $config[$key] ?? false;

    if (is_bool($value)) {
        return $value;
    }

    return in_array(strtolower((string) $value), ['1', 'true', 'yes', 'on'], true);
}

function header_value(string $name): string
{
    $serverKey = 'HTTP_' . strtoupper(str_replace('-', '_', $name));

    return isset($_SERVER[$serverKey]) ? (string) $_SERVER[$serverKey] : '';
}

function allowed_origins(array $config): array
{
    $origins = $config['allowed_origins'] ?? ['*'];

    if (is_string($origins)) {
        $origins = explode(',', $origins);
    }

    if (!is_array($origins)) {
        return ['*'];
    }

    $clean = [];

    foreach ($origins as $origin) {
        $origin = trim((string) $origin);

        if ($origin !== '') {
            $clean[] = $origin;
        }
    }

    return $clean ?: ['*'];
}

function is_origin_allowed(array $config, string $origin): bool
{
    $allowed = allowed_origins($config);

    if ($origin === '' || in_array('*', $allowed, true)) {
        return true;
    }

    return in_array($origin, $allowed, true);
}

function cors_origin(array $config, string $origin): string
{
    $allowed = allowed_origins($config);

    if ($origin !== '' && in_array($origin, $allowed, true)) {
        return $origin;
    }

    return $allowed[0] ?? '*';
}

function json_response(int $status, array $body, array $config, string $origin): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Access-Control-Allow-Origin: ' . cors_origin($config, $origin));
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    header('Vary: Origin');

    echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function parse_json_body(): array
{
    $raw = file_get_contents('php://input');

    if (!is_string($raw) || trim($raw) === '') {
        return [];
    }

    $payload = json_decode($raw, true);

    if (!is_array($payload)) {
        throw new RuntimeException('Invalid JSON');
    }

    return $payload;
}

function utf8_slice(string $value, int $maxLength): string
{
    if (function_exists('mb_substr')) {
        return mb_substr($value, 0, $maxLength, 'UTF-8');
    }

    return substr($value, 0, $maxLength);
}

function clean_text($value, int $maxLength = 500): string
{
    $text = is_scalar($value) ? (string) $value : '';
    $text = preg_replace('/\s+/u', ' ', $text);

    if (!is_string($text)) {
        $text = '';
    }

    return utf8_slice(trim($text), $maxLength);
}

function clean_amount($value): int
{
    if (!is_numeric($value)) {
        return 0;
    }

    $amount = (float) $value;

    if (!is_finite($amount) || $amount <= 0 || $amount > 1000000) {
        return 0;
    }

    return (int) round($amount);
}

function normalize_names($value): array
{
    if (!is_array($value)) {
        return [];
    }

    $names = [];

    foreach ($value as $name) {
        $name = clean_text($name, 80);

        if ($name !== '') {
            $names[] = $name;
        }

        if (count($names) >= 200) {
            break;
        }
    }

    return $names;
}

function format_payment_status(array $payload): string
{
    $status = clean_text($payload['status'] ?? '', 40);
    $claimed = ($payload['paymentClaimed'] ?? false) === true;

    if ($status === 'paid_claimed' || $claimed) {
        return 'Посетитель отметил оплату по СБП. Проверьте поступление на счете вручную.';
    }

    return 'Ожидает оплаты по СБП';
}

function validate_payload(array $payload): array
{
    $flow = clean_text($payload['flow'] ?? '', 20);
    $orderId = clean_text($payload['orderId'] ?? '', 40);
    $amount = clean_amount($payload['amount'] ?? 0);

    if ($orderId === '' || $amount === 0 || !in_array($flow, ['note', 'donation'], true)) {
        return ['ok' => false, 'error' => 'Invalid order payload'];
    }

    if ($flow === 'note') {
        $names = normalize_names($payload['names'] ?? []);
        $giverName = clean_text($payload['giverName'] ?? '', 100);

        if (!$names || $giverName === '') {
            return ['ok' => false, 'error' => 'Invalid note payload'];
        }
    }

    return ['ok' => true];
}

function format_messages(array $payload, array $config): array
{
    $flow = clean_text($payload['flow'] ?? '', 20);
    $orderId = clean_text($payload['orderId'] ?? '', 40);
    $amount = clean_amount($payload['amount'] ?? 0);
    $sourceUrl = clean_text($payload['sourceUrl'] ?? '', 300);
    $paymentUrl = clean_text($payload['paymentUrl'] ?? '', 300);
    $paymentStatus = format_payment_status($payload);

    if ($flow === 'donation') {
        $donorName = clean_text($payload['donorName'] ?? '', 100) ?: 'не указано';
        $lines = [
            "Пожертвование {$orderId}",
            '',
            "Статус: {$paymentStatus}",
            "Сумма: {$amount} руб.",
            "Имя жертвователя: {$donorName}",
            $sourceUrl ? "Страница: {$sourceUrl}" : '',
            $paymentUrl ? "Оплата: {$paymentUrl}" : '',
        ];
        $full = implode("\n", array_values(array_filter($lines, static fn($line) => $line !== '')));

        return [
            'subject' => "Пожертвование {$orderId}",
            'full' => $full,
            'telegram' => $full,
        ];
    }

    $names = normalize_names($payload['names'] ?? []);
    $serviceTitle = clean_text($payload['serviceTitle'] ?? '', 120);
    $noteKind = clean_text($payload['noteKind'] ?? '', 60);
    $giverName = clean_text($payload['giverName'] ?? '', 100);
    $contact = clean_text($payload['contact'] ?? '', 140) ?: 'не указан';
    $minimumAmount = clean_amount($payload['minimumAmount'] ?? 0);
    $paymentClaimedAt = clean_text($payload['paymentClaimedAt'] ?? '', 80);
    $namesBlock = implode("\n", array_map(static fn($name) => "- {$name}", $names));

    $lines = [
        "Записка {$orderId}",
        '',
        "Статус: {$paymentStatus}",
        "Вид: {$serviceTitle}",
        "Тип: {$noteKind}",
        'Имен: ' . count($names),
        "Минимальное пожертвование: {$minimumAmount} руб.",
        "Указанная сумма: {$amount} руб.",
        "Подающий: {$giverName}",
        "Контакт: {$contact}",
        $paymentClaimedAt ? "Отметка оплаты: {$paymentClaimedAt}" : '',
        '',
        'Имена:',
        $namesBlock,
        '',
        $sourceUrl ? "Страница: {$sourceUrl}" : '',
        $paymentUrl ? "Оплата: {$paymentUrl}" : '',
    ];

    $full = implode("\n", array_values(array_filter($lines, static fn($line) => $line !== '')));
    $summary = implode("\n", [
        "Новая записка {$orderId}",
        "{$serviceTitle}, {$noteKind}",
        'Имен: ' . count($names),
        "Сумма: {$amount} руб.",
        "Статус: {$paymentStatus}",
        'Полный текст записки отправлен на почту.',
    ]);

    return [
        'subject' => "Записка {$orderId}",
        'full' => $full,
        'telegram' => config_bool($config, 'send_full_to_telegram') ? $full : $summary,
    ];
}

function split_long_message(string $message, int $maxLength = MAX_MESSAGE_LENGTH): array
{
    if (strlen($message) <= $maxLength) {
        return [$message];
    }

    $chunks = [];
    $lines = explode("\n", $message);
    $current = '';

    foreach ($lines as $line) {
        $next = $current === '' ? $line : $current . "\n" . $line;

        if (strlen($next) > $maxLength) {
            if ($current !== '') {
                $chunks[] = $current;
            }

            $current = $line;
        } else {
            $current = $next;
        }
    }

    if ($current !== '') {
        $chunks[] = $current;
    }

    return $chunks;
}

function http_post_json(string $url, array $payload): array
{
    $body = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

    if (!is_string($body)) {
        throw new RuntimeException('JSON encoding failed');
    }

    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
            CURLOPT_POSTFIELDS => $body,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 15,
        ]);
        $responseBody = curl_exec($ch);
        $status = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($responseBody === false || $status < 200 || $status >= 300) {
            throw new RuntimeException($error ?: "HTTP request failed with {$status}");
        }

        return ['status' => $status, 'body' => (string) $responseBody];
    }

    $context = stream_context_create([
        'http' => [
            'method' => 'POST',
            'header' => "Content-Type: application/json\r\n",
            'content' => $body,
            'timeout' => 15,
        ],
    ]);
    $responseBody = file_get_contents($url, false, $context);

    if ($responseBody === false) {
        throw new RuntimeException('HTTP request failed');
    }

    return ['status' => 200, 'body' => (string) $responseBody];
}

function send_telegram(array $config, string $message): array
{
    if (config_bool($config, 'dry_run')) {
        return ['channel' => 'telegram', 'skipped' => false, 'dryRun' => true];
    }

    $token = trim((string) ($config['telegram_bot_token'] ?? ''));
    $chatId = trim((string) ($config['telegram_chat_id'] ?? ''));

    if ($token === '' || $chatId === '') {
        return ['channel' => 'telegram', 'skipped' => true];
    }

    $parts = split_long_message($message);

    foreach ($parts as $index => $part) {
        $text = count($parts) > 1 ? $part . "\n\nЧасть " . ($index + 1) . '/' . count($parts) : $part;
        http_post_json("https://api.telegram.org/bot{$token}/sendMessage", [
            'chat_id' => $chatId,
            'text' => $text,
            'disable_web_page_preview' => true,
        ]);
    }

    return ['channel' => 'telegram', 'skipped' => false, 'parts' => count($parts)];
}

function email_address(string $value): string
{
    if (preg_match('/<([^>]+)>/', $value, $matches)) {
        return trim($matches[1]);
    }

    return trim($value);
}

function encode_subject(string $subject): string
{
    return '=?UTF-8?B?' . base64_encode($subject) . '?=';
}

function smtp_read($socket): string
{
    $response = '';

    while (($line = fgets($socket, 515)) !== false) {
        $response .= $line;

        if (isset($line[3]) && $line[3] === ' ') {
            break;
        }
    }

    return $response;
}

function smtp_expect($socket, array $codes): string
{
    $response = smtp_read($socket);
    $code = (int) substr($response, 0, 3);

    if (!in_array($code, $codes, true)) {
        throw new RuntimeException('SMTP failed: ' . trim($response));
    }

    return $response;
}

function smtp_command($socket, string $command, array $codes): string
{
    fwrite($socket, $command . "\r\n");

    return smtp_expect($socket, $codes);
}

function send_smtp_email(array $config, string $subject, string $message): array
{
    $host = trim((string) ($config['smtp_host'] ?? ''));
    $port = (int) ($config['smtp_port'] ?? 465);
    $secure = strtolower((string) ($config['smtp_secure'] ?? 'ssl'));
    $user = trim((string) ($config['smtp_user'] ?? ''));
    $pass = (string) ($config['smtp_pass'] ?? '');
    $to = trim((string) ($config['mail_to'] ?? ''));
    $from = trim((string) ($config['mail_from'] ?? '')) ?: $user;

    if ($host === '' || $user === '' || $pass === '' || $to === '' || $from === '') {
        return ['channel' => 'email', 'skipped' => true];
    }

    $target = ($secure === 'ssl' || $secure === 'true' || $secure === '1' ? 'ssl://' : '') . $host;
    $socket = fsockopen($target, $port, $errno, $errstr, 20);

    if (!$socket) {
        throw new RuntimeException("SMTP connection failed: {$errstr}");
    }

    stream_set_timeout($socket, 20);

    try {
        smtp_expect($socket, [220]);
        smtp_command($socket, 'EHLO ' . ($_SERVER['SERVER_NAME'] ?? 'localhost'), [250]);

        if ($secure === 'tls') {
            smtp_command($socket, 'STARTTLS', [220]);

            if (!stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
                throw new RuntimeException('SMTP STARTTLS failed');
            }

            smtp_command($socket, 'EHLO ' . ($_SERVER['SERVER_NAME'] ?? 'localhost'), [250]);
        }

        smtp_command($socket, 'AUTH LOGIN', [334]);
        smtp_command($socket, base64_encode($user), [334]);
        smtp_command($socket, base64_encode($pass), [235]);
        smtp_command($socket, 'MAIL FROM:<' . email_address($from) . '>', [250]);

        foreach (explode(',', $to) as $recipient) {
            $recipient = email_address($recipient);

            if ($recipient !== '') {
                smtp_command($socket, 'RCPT TO:<' . $recipient . '>', [250, 251]);
            }
        }

        smtp_command($socket, 'DATA', [354]);

        $headers = [
            'From: ' . $from,
            'To: ' . $to,
            'Subject: ' . encode_subject($subject),
            'MIME-Version: 1.0',
            'Content-Type: text/plain; charset=UTF-8',
            'Content-Transfer-Encoding: 8bit',
            'Date: ' . date(DATE_RFC2822),
        ];
        $body = implode("\r\n", $headers) . "\r\n\r\n" . str_replace("\n", "\r\n", $message);
        $body = preg_replace('/^\./m', '..', $body);
        fwrite($socket, $body . "\r\n.\r\n");
        smtp_expect($socket, [250]);
        smtp_command($socket, 'QUIT', [221]);
    } finally {
        fclose($socket);
    }

    return ['channel' => 'email', 'skipped' => false, 'transport' => 'smtp'];
}

function send_mail_email(array $config, string $subject, string $message): array
{
    $to = trim((string) ($config['mail_to'] ?? ''));
    $from = trim((string) ($config['mail_from'] ?? '')) ?: trim((string) ($config['smtp_user'] ?? ''));

    if ($to === '') {
        return ['channel' => 'email', 'skipped' => true];
    }

    $headers = [
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=UTF-8',
        'Content-Transfer-Encoding: 8bit',
    ];

    if ($from !== '') {
        $headers[] = 'From: ' . $from;
    }

    $ok = mail($to, encode_subject($subject), $message, implode("\r\n", $headers));

    if (!$ok) {
        throw new RuntimeException('PHP mail failed');
    }

    return ['channel' => 'email', 'skipped' => false, 'transport' => 'mail'];
}

function send_email(array $config, string $subject, string $message): array
{
    if (config_bool($config, 'dry_run')) {
        return ['channel' => 'email', 'skipped' => false, 'dryRun' => true];
    }

    $transport = strtolower((string) ($config['mail_transport'] ?? 'auto'));
    $hasSmtp = trim((string) ($config['smtp_host'] ?? '')) !== ''
        && trim((string) ($config['smtp_user'] ?? '')) !== ''
        && (string) ($config['smtp_pass'] ?? '') !== '';

    if (($transport === 'smtp' || ($transport === 'auto' && $hasSmtp))) {
        return send_smtp_email($config, $subject, $message);
    }

    if ($transport === 'mail' || $transport === 'auto') {
        return send_mail_email($config, $subject, $message);
    }

    return ['channel' => 'email', 'skipped' => true];
}

function run_channel(string $channel, callable $task): array
{
    try {
        return $task();
    } catch (Throwable $error) {
        return [
            'channel' => $channel,
            'skipped' => false,
            'error' => $error->getMessage(),
        ];
    }
}

$config = load_config();
$origin = header_value('Origin');
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if (!is_origin_allowed($config, $origin)) {
    json_response(403, ['ok' => false, 'error' => 'Origin is not allowed'], $config, $origin);
}

if ($method === 'OPTIONS') {
    json_response(204, [], $config, $origin);
}

if ($method !== 'POST') {
    json_response(405, ['ok' => false, 'error' => 'Method not allowed'], $config, $origin);
}

try {
    $payload = parse_json_body();
} catch (Throwable $error) {
    json_response(400, ['ok' => false, 'error' => 'Invalid JSON'], $config, $origin);
}

if (clean_text($payload['website'] ?? '', 200) !== '') {
    json_response(200, ['ok' => true, 'ignored' => true], $config, $origin);
}

$validation = validate_payload($payload);

if (($validation['ok'] ?? false) !== true) {
    json_response(400, ['ok' => false, 'error' => $validation['error'] ?? 'Invalid payload'], $config, $origin);
}

$messages = format_messages($payload, $config);
$results = [
    run_channel('email', static fn() => send_email($config, $messages['subject'], $messages['full'])),
    run_channel('telegram', static fn() => send_telegram($config, $messages['telegram'])),
];

$delivered = array_values(array_filter($results, static function (array $result): bool {
    return empty($result['skipped']) && empty($result['error']);
}));

if (!$delivered) {
    json_response(502, [
        'ok' => false,
        'error' => 'No notification channel delivered the message',
        'results' => $results,
    ], $config, $origin);
}

json_response(200, [
    'ok' => true,
    'delivered' => array_values(array_map(static fn(array $result) => $result['channel'], $delivered)),
    'results' => $results,
], $config, $origin);
