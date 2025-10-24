<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require 'vendor/autoload.php';

header('Content-Type: application/json; charset=utf-8');

// Защита от спама
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Метод не разрешен']);
    exit;
}

// Получаем данные
$firstname = isset($_POST['firstname']) ? trim($_POST['firstname']) : '';
$lastname = isset($_POST['lastname']) ? trim($_POST['lastname']) : '';
$email = isset($_POST['email']) ? trim($_POST['email']) : '';
$phone = isset($_POST['phone']) ? trim($_POST['phone']) : '';
$city = isset($_POST['city']) ? trim($_POST['city']) : '';
$company = isset($_POST['company']) ? trim($_POST['company']) : '';

// Валидация
if (empty($firstname) || empty($lastname) || empty($email) || empty($phone)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Заполните все обязательные поля']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Неверный формат email']);
    exit;
}

// Создаем объект PHPMailer
$mail = new PHPMailer(true);

try {
    // Настройки SMTP Яндекса
    $mail->isSMTP();
    $mail->Host       = 'smtp.yandex.ru';
    $mail->SMTPAuth   = true;
    $mail->Username   = 'info@fit-solution.online';
    $mail->Password   = 'aczdetolnrxjggjq';  // <<<< ЗАМЕНИТЕ ЭТОТ ТЕКСТ!
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
    $mail->Port       = 465;
    $mail->CharSet    = 'UTF-8';

    // От кого и кому
    $mail->setFrom('info@fit-solution.online', 'Сайт FIT-Solution');
    $mail->addAddress('info@fit-solution.online');
    $mail->addReplyTo($email, "$firstname $lastname");

    // Тема и содержание
    $mail->isHTML(true);
    $mail->Subject = 'Новая заявка с сайта fit-solution.online';
    
    $mail->Body = "
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; }
            .header { background: #2C3E50; color: white; padding: 20px; text-align: center; }
            .content { background: white; padding: 30px; margin-top: 20px; border-radius: 8px; }
            .field { margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 5px; }
            .label { font-weight: bold; color: #2C3E50; display: block; margin-bottom: 5px; }
            .value { color: #555; }
        </style>
    </head>
    <body>
        <div class='container'>
            <div class='header'>
                <h2>📧 Новая заявка с сайта</h2>
            </div>
            <div class='content'>
                <div class='field'>
                    <span class='label'>👤 Имя:</span>
                    <span class='value'>" . htmlspecialchars($firstname) . "</span>
                </div>
                <div class='field'>
                    <span class='label'>👤 Фамилия:</span>
                    <span class='value'>" . htmlspecialchars($lastname) . "</span>
                </div>
                <div class='field'>
                    <span class='label'>📧 Email:</span>
                    <span class='value'><a href='mailto:" . htmlspecialchars($email) . "'>" . htmlspecialchars($email) . "</a></span>
                </div>
                <div class='field'>
                    <span class='label'>📞 Телефон:</span>
                    <span class='value'>" . htmlspecialchars($phone) . "</span>
                </div>";
    
    if (!empty($city)) {
        $mail->Body .= "
                <div class='field'>
                    <span class='label'>🏙️ Город:</span>
                    <span class='value'>" . htmlspecialchars($city) . "</span>
                </div>";
    }
    
    if (!empty($company)) {
        $mail->Body .= "
                <div class='field'>
                    <span class='label'>🏢 Компания:</span>
                    <span class='value'>" . htmlspecialchars($company) . "</span>
                </div>";
    }
    
    $mail->Body .= "
            </div>
        </div>
    </body>
    </html>
    ";

    $mail->AltBody = "Новая заявка\n\nИмя: $firstname\nФамилия: $lastname\nEmail: $email\nТелефон: $phone\nГород: $city\nКомпания: $company";

    // Отправляем
    $mail->send();
    echo json_encode(['success' => true, 'message' => 'Спасибо! Мы свяжемся с вами в ближайшее время.']);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Ошибка отправки: ' . $mail->ErrorInfo]);
}
?>
