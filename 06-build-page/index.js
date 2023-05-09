const fs = require('fs');
const path = require('path');

const componentsFolderPath = path.join(__dirname, 'components');
const stylesFolderPath = path.join(__dirname, 'styles');
const assetsFolderPath = path.join(__dirname, 'assets');
const templateFilePath = path.join(__dirname, 'template.html');
let outputFolderPath = path.join(__dirname, 'project-dist');

// Читаем шаблонный файл:
async function readTemplateFile() {
	try {
		const templateContent = await fs.promises.readFile(templateFilePath, 'utf8');
		return templateContent;
	} catch (error) {
		console.error('Error reading template file:', error);
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
		console.error(`Error reading component file (${tag}.html):`, error);
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
		console.error('Error creating index.html:', error);
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
				console.error(`Error reading CSS file (${cssFile}):`, error);
				throw error;
			}
		})
	);
	const bundlePath = path.join(outputFolderPath, 'style.css');
	try {
		await fs.promises.writeFile(bundlePath, cssContent.join('\n'), 'utf8');
		console.log('style.css created');
	} catch (error) {
		console.error('Error creating style.css:', error);
		throw error;
	}
}

// Копируем папку assets
async function copyFolder(sourceFolderPath, targetFolderPath) {
	try {
		await fs.promises.mkdir(targetFolderPath, { recursive: true });

		const files = await fs.promises.readdir(sourceFolderPath);

		for (const file of files) {
			const sourcePath = path.join(sourceFolderPath, file);
			const targetPath = path.join(targetFolderPath, file);

			const fileStat = await fs.promises.stat(sourcePath);

			if (fileStat.isFile()) {

				// Проверяем, существует ли файл в папке назначения
				const targetFileExists = await fs.promises
					.access(targetPath)
					.then(() => true)
					.catch(() => false);

				// Если файл уже существует, то пропускаем его
				if (targetFileExists) {
					console.log(`File ${file} already exists in the target folder.`);
					continue;
				}

				await fs.promises.copyFile(sourcePath, targetPath);
				console.log(`Copied ${file} to assets folder`);
			} else if (fileStat.isDirectory()) {
				await copyFolder(sourcePath, targetPath);
			}
		}

		console.log(`Copied folder from ${sourceFolderPath} to ${targetFolderPath}`);
	} catch (error) {
		console.error(`Error copying folder from ${sourceFolderPath} to ${targetFolderPath}:`, error);
		throw error;
	}
}


async function copyAssetsFolder() {
	const srcFolder = path.join(__dirname, 'assets');
	const destFolder = path.join(outputFolderPath, 'assets');

	try {
			await fs.promises.mkdir(destFolder, { recursive: true });
			console.log(`Created folder ${destFolder}`);
	} catch (error) {
			console.error(`Error creating folder ${destFolder}:`, error);
			throw error;
	}

	try {
			await copyFolder(srcFolder, destFolder);
			console.log('Assets folder was copied');
	} catch (error) {
			console.error('Error copying assets folder:', error);
			throw error;
	}
}

async function copyFilesRecursively(src, dest) {
	const entries = await fs.promises.readdir(src, { withFileTypes: true });

	for (const entry of entries) {
		const srcPath = path.join(src, entry.name);
		const destPath = path.join(dest, entry.name);

		if (entry.isDirectory()) {
			await copyFilesRecursively(srcPath, destPath);
		} else {
			await fs.promises.copyFile(srcPath, destPath);
		}
	}
}

// Создаем новую страницу
async function buildPage() {
	try {
		// Проверяем существует ли папка project-dist
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

		// Заменяем шаблонные теги из содержимого папки components
		for (const tagName of tagNames) {
			const componentFilePath = path.join(componentsFolderPath, `${tagName}.html`);
			const componentContent = await fs.promises.readFile(componentFilePath, 'utf-8');
			templateContent = templateContent.replace(`{{${tagName}}}`, componentContent);
		}

		// Записываем измененный шаблон в index.html в папке project-dist
		const outputPath = path.resolve(outputFolderPath, 'index.html');
		await fs.promises.writeFile(outputPath, templateContent, 'utf-8');
		console.log('Index.html created successfully!');

		// Собираем все стили в один файл
		await createCssBundle();

		// Создаем папку assets если ее нет и копируем содержимое
		await copyAssetsFolder();

		console.log('Page was built');
	} catch (error) {
		console.error('Error building the page:', error);
	}
}

buildPage();