const fs = require('fs');
const path = require('path');

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

const saveFile = (destPath, buffer) => {
  ensureDir(path.dirname(destPath));
  fs.writeFileSync(destPath, buffer);
  return destPath;
};

const deleteFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (err) {
    console.error('[storage] delete failed:', err.message);
  }
};

const fileExists = (filePath) => fs.existsSync(filePath);

module.exports = { saveFile, deleteFile, fileExists, ensureDir };
