const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

const storeFiles = (folderName, allowedMimetypes = []) => {
  const fileStorage = multer.diskStorage(function getStorageConfig() {
    const id = uuidv4();
    const preSub = id.slice(id.length - 4, id.length - 2);
    const subDir = id.slice(id.length - 2);

    console.log(id, preSub, subDir);

    return {
      destination: (req, file, cb) => {
        cb(null, `images/${folderName}/${preSub}/${subDir}`);
      },
      filename: (req, file, cb) => {
        console.log('FILE DETAILS', file);
        cb(null, `${id}-${file.originalname}`);
      },
    };
  }());

  const fileFilter = (req, file, cb) => {
    const pass = allowedMimetypes.includes(file.mimetype);
    cb(null, pass);
  };

  return multer({ storage: fileStorage, fileFilter });
};

module.exports = storeFiles;
