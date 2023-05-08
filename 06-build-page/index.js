const fs = require('fs');
const path = require('path');

const componentsFolderPath = path.join(__dirname, 'components');
const stylesFolderPath = path.join(__dirname, 'styles');
const assetsFolderPath = path.join(__dirname, 'assets');
const templateFilePath = path.join(__dirname, 'template.html');
let outputFolderPath = path.join(__dirname, 'project-dist');

async function copyFolder(sourceFolderPath, targetFolderPath) {
	try {
	// Создаем целевую папку (project-dist)
	await fs.promises.mkdir(targetFolderPath);

	// Читаем папки и файлы в исходной папке
	const files = await fs.promises.readdir(sourceFolderPath);

	// Рекурсивно копируем файлы и папки
	for (const file of files) {
		const sourcePath = path.join(sourceFolderPath, file);
		const targetPath = path.join(targetFolderPath, file);
		const fileStat = await fs.promises.stat(sourcePath);

		if (fileStat.isFile()) {
			// Копируем файлы
			await fs.promises.copyFile(sourcePath, targetPath);
		} else if (fileStat.isDirectory()) {
			// Рекурсивно копируем папку
			await copyFolder(sourcePath, targetPath);
		}
	}
	console.log(`copied folder from ${sourceFolderPath} to ${targetFolderPath} successfully!`);
} catch (error) {
	console.error(`error copying folder from ${sourceFolderPath} to ${targetFolderPath}:`, error);
}
}

// Читаем шаблонный файл
async function readTemplateFile() {
	try {
		const templateContent = await fs.promises.readFile(templateFilePath, 'utf8');
		return templateContent;
	} catch (error) {
		console.error('error reading template file:', error);
		throw error;
	}
}

// Находим теги из папки components
function findComponentTags(templateContent) {
	const tagRegex = /{{\s*([a-zA-Z0-9_-]+)\s*}}/g;
	const tags = new Set();
	let match;
	while ((match = tagRegex.exec(templateContent)) !== null) {
		const tagName = match[1];
		tags.add(tagName);
	}
	return Array.from(tags);
}

// Заменяем теги модифицированным контентом
async function replaceComponentTags(templateContent, tags) {
	let modifiedContent = templateContent;
	for (const tag of tags) {
		const componentFilePath = path.join(componentsFolderPath, `${tag}.html`);
		try {
			const componentContent = await fs.promises.readFile(componentFilePath, 'utf8');
			modifiedContent = modifiedContent.replace(new RegExp(`{{\\s*${tag}\\s*}}`, 'g'), componentContent);
		} catch (error) {
			console.error(`error reading (${tag}.html):`, error);
			throw error;
		}
	}
	return modifiedContent;
}

// Создаем index.html
async function createIndexHtml(content) {
	const outputPath = path.join(outputFolderPath, 'index.html');
	try {
		await fs.promises.writeFile(outputPath, content, 'utf8');
		console.log('index.html was created');
	} catch (error) {
		console.error('error creating index.html file:', error);
		throw error;
	}
}

// Создаем bundle css файлов
async function createCssBundle() {
	const cssFiles = await fs.promises.readdir(stylesFolderPath);
	const cssContent = await Promise.all(
		cssFiles.map(async (cssFile) => {
			const filePath = path.join(stylesFolderPath, cssFile);
			try {
				const fileContent = await fs.promises.readFile(filePath, 'utf8');
				return fileContent;
			} catch (error) {
				console.error(`error reading css file (${cssFile}):`, error);
				throw error;
			}
		})
	);
	const bundlePath = path.join(outputFolderPath, 'style.css');
	try {
		await fs.promises.writeFile(bundlePath, cssContent.join('\n'), 'utf8');
		console.log('style.css was created');
	} catch (error) {
		console.error('error creating style.css file:', error);
		throw error;
	}
}

// Копируем папку assets
async function copyAssetsFolder() {
	const assetsOutputFolderPath = path.join(outputFolderPath, 'assets');
		try {
			await fs.promises.mkdir(assetsOutputFolderPath);
			console.log('assets was folder created');
		} catch (error) {
		if (error.code !== 'EEXIST') {
			console.error('error creating assets folder:', error);
		throw error;
		}
	}

	const files = await fs.promises.readdir(assetsFolderPath);
	for (const file of files) {
		const srcPath = path.join(assetsFolderPath, file);
		const destPath = path.join(assetsOutputFolderPath, file);
		try {
			await fs.promises.copyFile(srcPath, destPath);
			console.log(`copied ${file} to assets folder`);
		} catch (error) {
			console.error(`error copying ${file} to assets folder:`, error);
			throw error;
		}
	}
	console.log('assets folder was copied');
}

// Создаем новую страницу
async function buildPage() {
	try {
	// Проверяеv существetn ли папка project-dist
	const exists = await fs.promises.access(outputFolderPath)
	.then(() => true)
	.catch(() => false);

	// Создаем папку project-dist если ее нет
	if (!exists) {
		await fs.promises.mkdir(outputFolderPath);
	}

	// Читаем и сохраняем шаблон
	let templateContent = await fs.promises.readFile(templateFilePath, 'utf-8');

	// Находим все теги в шаблоне
	const tagNames = templateContent.match(/{{(.*?)}}/g).map((tag) => tag.slice(2, -2));

	// Замяем шаблонные теги из содержимого папки components
	for (const tagName of tagNames) {
		const componentFilePath = path.join(componentsFolderPath, `${tagName}.html`);
		const componentContent = await fs.promises.readFile(componentFilePath, 'utf-8');
		templateContent = templateContent.replace(`{{${tagName}}}`, componentContent);
	}

	// Записываем измененный шаблон в index.html в папке project-dist
	const outputPath = path.resolve(outputFolderPath, 'index.html');
	await fs.promises.writeFile(outputPath, templateContent, 'utf-8');
	console.log('index.html was created');

	// Собираем все стили в один файл
	const stylesFiles = await fs.promises.readdir(stylesFolderPath);
	let stylesContent = '';
	for (const file of stylesFiles) {
		const filePath = path.join(stylesFolderPath, file);
		const fileContent = await fs.promises.readFile(filePath, 'utf-8');
		stylesContent += fileContent;
	}

	// Записываем стили в style.css в папке project-dist
	const stylesOutputPath = path.join(outputFolderPath, 'style.css');
	await fs.promises.writeFile(stylesOutputPath, stylesContent, 'utf-8');
	console.log('style.css file was created');

	// Создаем папку assets если ее нет
	const assetsOutputFolderPath = path.join(outputFolderPath, 'assets');
	const assetsExists = await fs.promises.access(assetsOutputFolderPath)
		.then(() => true)
		.catch(() => false);

	if (!assetsExists) {
		await fs.promises.mkdir(assetsOutputFolderPath);
	}

	// Копируем папку assets в project-dist/assets
	const assetsFiles = await fs.promises.readdir(assetsFolderPath);
	for (const file of assetsFiles) {
		const srcPath = path.join(assetsFolderPath, file);
		const destPath = path.join(assetsOutputFolderPath, file);
		const stats = await fs.promises.stat(srcPath);
		if (stats.isFile()) {
			await fs.promises.copyFile(srcPath, destPath);
			console.log(`Copied ${file} to the assets folder`);
		}
	}
	console.log('Page was built');
	} catch (error) {
	console.error('Error building the page:', error);
	}
}

buildPage();

// Проверяем существует ли папка
async function checkFolderExists(folderPath) {
	try {
		const stats = await fs.promises.stat(folderPath);
		return stats.isDirectory();
	} catch (error) {
	if (error.code === 'ENOENT') {
		return false;
	}
	throw error;
	}
}