import path from 'path';

export const CONTENT_DIR = process.env.CONTENT_DIR || path.resolve(import.meta.dirname, '../../content');
export const SHORTCODES_DIR = process.env.SHORTCODES_DIR || path.resolve(import.meta.dirname, '../../layouts/shortcodes');
