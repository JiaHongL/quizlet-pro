const fs = require('fs');
const zlib = require('zlib');
const archiver = require('archiver');
const path = require('path');

const sourceFolder = 'dist/quizlet-pro';
const zipFileName = 'quizlet-pro.zip';
const outputFolder = './dist';

const zipFilePath = path.join(outputFolder, zipFileName);

// 如果已存在，先删除
if (fs.existsSync(zipFilePath)) {
  fs.unlinkSync(zipFilePath);
}

const output = fs.createWriteStream(path.join(outputFolder, zipFileName));
const archive = archiver('zip', {
  zlib: { level: zlib.constants.Z_BEST_COMPRESSION }
});

output.on('close', () => {
  console.log(`Successfully created ${zipFileName}.`);
});

archive.on('error', (err) => {
  throw err;
});

archive.pipe(output);

archive.directory(sourceFolder, false);

archive.finalize();
