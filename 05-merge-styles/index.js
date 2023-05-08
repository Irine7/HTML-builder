const fs = require('fs');
const path = require ('path');

// Создаем функцию для bundle styles
function createBundle() {
	const stylesFolder = path.resolve(__dirname, 'styles');
	const bundlePath = path.resolve(__dirname, 'project-dist', 'bundle.css');

	// Читаем содержимое папки styles
	fs.readdir(stylesFolder, { withFileTypes: true }, (err, files) => {
		if (err) {
			console.error('Error reading styles folder:', err);
			return;
		}

		// Фильтруем файлы с нужным расширением
		const cssFiles = files
			.filter(file => file.isFile() && path.extname(file.name) === '.css')
			.map(file => path.resolve(stylesFolder, file.name));

		// Читаем файлы стилей
		Promise.all(cssFiles.map(file => fs.promises.readFile(file, 'utf8')))
			.then(contents => {
				// Записываем прочитанные данные в массив
				const bundleContent = contents.join('\n');

				// Записываем массив стилей в bundle.css
				fs.writeFile(bundlePath, bundleContent, err => {
					if (err) {
						console.error('Error writing bundle file:', err);
						return;
					}
					
					console.log('CSS bundle was created!');
				});
			})
			.catch(error => {
				console.error('Error reading CSS files:', error);
			});
	});
}

createBundle();
