// Для подключения модуля используем функцию require()
const fs = require('fs');
const path = require('path');

// Получаем стрим для чтения файлов
const stream = fs.createReadStream(path.join(__dirname, 'text.txt'), 'utf-8');

let data = '';

// Собираем все чанки вместе
stream.on('data', chunk => data += chunk);
stream.on('end', () => console.log(data));
stream.on('error', error => console.error('Error:', error));