import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { BadRequestException } from '@nestjs/common';
import * as fs from 'fs';

export const MESSAGE_ALLOWED_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/gif',
  'application/pdf',
  'application/zip',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export const AVATAR_ALLOWED_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/gif',
  'image/webp',
];

export const MESSAGE_MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
export const AVATAR_MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const UPLOAD_PATHS = {
  messages: 'public/uploads/messages',
  avatars: 'public/uploads/avatars',
};

const ensureDirectoryExists = (path: string): void => {
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path, { recursive: true });
  }
};

const generateFilename = (file: Express.Multer.File): string => {
  return `${uuidv4()}${extname(file.originalname)}`;
};

const messageFileFilter = (
  req: any,
  file: Express.Multer.File,
  cb: (error: Error | null, acceptFile: boolean) => void,
) => {
  if (!MESSAGE_ALLOWED_TYPES.includes(file.mimetype)) {
    return cb(new BadRequestException('Unsupported file type'), false);
  }
  cb(null, true);
};

const avatarFileFilter = (
  req: any,
  file: Express.Multer.File,
  cb: (error: Error | null, acceptFile: boolean) => void,
) => {
  if (!AVATAR_ALLOWED_TYPES.includes(file.mimetype)) {
    return cb(new BadRequestException('Only image files are allowed for avatar'), false);
  }
  cb(null, true);
};

export const messageUploadConfig = {
  storage: diskStorage({
    destination: (req, file, cb) => {
      ensureDirectoryExists(UPLOAD_PATHS.messages);
      cb(null, UPLOAD_PATHS.messages);
    },
    filename: (req, file, cb) => {
      cb(null, generateFilename(file));
    },
  }),
  limits: { fileSize: MESSAGE_MAX_FILE_SIZE },
  fileFilter: messageFileFilter,
};

export const avatarUploadConfig = {
  storage: diskStorage({
    destination: (req, file, cb) => {
      ensureDirectoryExists(UPLOAD_PATHS.avatars);
      cb(null, UPLOAD_PATHS.avatars);
    },
    filename: (req, file, cb) => {
      cb(null, generateFilename(file));
    },
  }),
  limits: { fileSize: AVATAR_MAX_FILE_SIZE },
  fileFilter: avatarFileFilter,
};
