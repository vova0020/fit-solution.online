const bcrypt = require('bcrypt');

// Генерируем хэш для пароля "fit012@13dka_a!34"
const password = 'fit012@13dka_a!34';
const hash = bcrypt.hashSync(password, 10);

console.log('Пароль:', password);
console.log('Хэш:', hash);

// Проверяем, что хэш работает
const isValid = bcrypt.compareSync(password, hash);
console.log('Проверка хэша:', isValid);