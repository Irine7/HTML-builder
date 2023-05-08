const fs = require('fs');
const path = require('path');

// Создаем функцию для bundle styles
async function createCssBundle() {
	const stylesDirectory = path.join(__dirname, 'styles');
	const bundlePath = path.join(__dirname, 'project-dist', 'bundle.css');

	try {
		const files = await fs.promises.readdir(stylesDirectory, { withFileTypes: true });

		// Фильтруем файлы с нужным расширением
		const cssFiles = files
			.filter(file => file.isFile() && path.extname(file.name) === '.css')
			.map(file => path.join(stylesDirectory, file.name));

		// Читаем файлы стилей
		const contents = await Promise.all(cssFiles.map(file => fs.promises.readFile(file, 'utf8')));
		const bundleContent = contents.join('\n');
		await fs.promises.writeFile(bundlePath, bundleContent);

		console.log('CSS bundle was created.');
	} catch (error) {
		console.error('Error creating CSS bundle.', error);
	}
}

createCssBundle();