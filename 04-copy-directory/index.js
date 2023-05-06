const fs = require('fs').promises;
const path = require('path');

// Создаем папку files-copy, если ее не существует
async function copyFolder() {
	const sourceFolder = path.resolve(__dirname, 'files');
	const newFolder = path.resolve(__dirname, 'files-copy');

	try {
		await fs.mkdir(newFolder, { recursive: true });
	} catch (error) {
		throw error;
	}

	// Читаем содержимое папки files
	const files = await fs.readdir(sourceFolder);

	// Копируем файлы из папки files в папку files-copy
	await Promise.all(
		files.map(async (file) => {
			const sourcePath = path.join(sourceFolder, file);
			const newPath = path.join(newFolder, file);

			const stat = await fs.stat(sourcePath);
			if (stat.isFile()) {
				await fs.copyFile(sourcePath, newPath);
			}
		})
	);
	
	console.log('End of copying');
}

copyFolder().catch((error) => {
	console.error('Error ocurred:', error);
});
