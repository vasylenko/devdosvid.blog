import path from 'path';

export const CONTENT_DIR = process.env.CONTENT_DIR || path.resolve(import.meta.dirname, '../../content');
export const SHORTCODES_DIR = process.env.SHORTCODES_DIR || path.resolve(import.meta.dirname, '../../layouts/shortcodes');

export function postDir(year, slug) {
  return path.join(CONTENT_DIR, 'posts', year, slug);
}

export function postFile(year, slug) {
  return path.join(postDir(year, slug), 'index.md');
}

const YEAR_RE = /^\d{4}$/;
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function validateYear(year) {
  return YEAR_RE.test(year);
}

export function validateSlug(slug) {
  return slug.length > 0 && SLUG_RE.test(slug);
}

export function sanitizeFilename(name) {
  return path.basename(name).replace(/[^a-zA-Z0-9._-]/g, '_');
}
