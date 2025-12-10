import { diskStorage } from 'multer';
import { extname } from 'path';

export const multerConfig = {
  storage: diskStorage({
    destination: './uploads',
    filename: (req, file, callback) => {
      const uniqueSuffix = Date.now() + '_' + Math.round(Math.random() * 10);
      const ext = extname(file.originalname);
      callback(null, uniqueSuffix + ext);
    },
  }),
};

export const imageFileFilter = (req, file, callback) => {
  if (!file.mimetype.startsWith('image/')) {
    return callback(new Error('Apenas imagens são permitidas'), false);
  }
  callback(null, true);
};
