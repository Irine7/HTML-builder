const fs = require('fs');
const path = require('path');
const { stdin, stdout } = process; //Стандартные потоки ввода/вывода

stdout.write('Type here...');

stdin.on('data', data => {
	const name = data.toString();
	if (name.trim() === 'exit') { // Выход если пользователь нажал 'exit'
		console.log('Have a nice day!')
		process.exit()
	}

	fs.appendFile(
		path.resolve(__dirname, 'text.txt'), name, err => {
			if (err) {
				throw err;
			}
		})
})

// Обработчик сигнала SIGINT для прерывания программы
process.on('SIGINT', () => {
	console.log('Have a nice day!')
	process.exit()
})