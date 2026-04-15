import multer from 'multer';
import path from 'path';
import { randomUUID } from 'crypto';

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, path.join(__dirname, '..', '..', 'uploads'));
  },
  filename(_req, file, cb) {
    const ext = path.extname(file.originalname) || '.bin';
    cb(null, `${randomUUID()}${ext}`);
  },
});

const fileFilter = (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedPrefixes = ['image/', 'video/'];
  const isAllowed = allowedPrefixes.some((prefix) => file.mimetype.startsWith(prefix));
  if (isAllowed) cb(null, true);
  else cb(new Error('Only image and video files are allowed'));
};

export const feedbackUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 30 * 1024 * 1024 },
});
