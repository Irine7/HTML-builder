const fs = require('fs').promises;
const path = require('path');

const folderPath = path.join(__dirname, 'secret-folder');

fs.readdir(folderPath, { withFileTypes: true })

// Фильтрация dirents, чтобы остались только файлы
.then((dirents) => {
	const filePromises = dirents
		.filter((dirent) => dirent.isFile())
		// .map() для создания массива промисов, представляющих каждый файл
		.map(async (dirent) => {
			const fileName = dirent.name;
			const filePath = path.join(folderPath, fileName);
			const stats = await fs.stat(filePath);
			const fileExtension = path.extname(fileName);
			const fileSize = stats.size;
			console.log(`${fileName.split('.')[0]} - ${fileExtension} - ${fileSize}kb`);
		});
	return Promise.all(filePromises);
})

.catch((error) => {
	console.error('Error occured:', error);
});
