import path from 'path';

export const CONTENT_DIR = process.env.CONTENT_DIR || path.resolve(import.meta.dirname, '../../content');
