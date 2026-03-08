import { describe, it, expect } from 'vitest';
import { sanitizeFilename, validateYear, validateSlug } from './config.js';

describe('sanitizeFilename', () => {
  it('keeps clean filenames unchanged', () => {
    expect(sanitizeFilename('cover.png')).toBe('cover.png');
    expect(sanitizeFilename('my-image_2.jpg')).toBe('my-image_2.jpg');
  });

  it('replaces special characters with underscores', () => {
    expect(sanitizeFilename('hello world!.png')).toBe('hello_world_.png');
  });

  it('strips directory traversal components', () => {
    expect(sanitizeFilename('../../etc/passwd')).toBe('passwd');
    expect(sanitizeFilename('../secret.txt')).toBe('secret.txt');
  });

  it('strips absolute path prefixes', () => {
    expect(sanitizeFilename('/etc/shadow')).toBe('shadow');
  });

  it('handles nested path separators', () => {
    expect(sanitizeFilename('a/b/c/image.png')).toBe('image.png');
  });
});

describe('validateYear', () => {
  it('accepts valid four-digit years', () => {
    expect(validateYear('2024')).toBe(true);
    expect(validateYear('2026')).toBe(true);
  });

  it('rejects non-four-digit strings', () => {
    expect(validateYear('24')).toBe(false);
    expect(validateYear('20245')).toBe(false);
    expect(validateYear('abcd')).toBe(false);
    expect(validateYear('')).toBe(false);
  });
});

describe('validateSlug', () => {
  it('accepts valid kebab-case slugs', () => {
    expect(validateSlug('my-first-post')).toBe(true);
    expect(validateSlug('post123')).toBe(true);
  });

  it('rejects slugs with uppercase or special characters', () => {
    expect(validateSlug('My-Post')).toBe(false);
    expect(validateSlug('post_one')).toBe(false);
    expect(validateSlug('post.one')).toBe(false);
  });

  it('rejects empty strings', () => {
    expect(validateSlug('')).toBe(false);
  });

  it('rejects slugs with leading or trailing hyphens', () => {
    expect(validateSlug('-post')).toBe(false);
    expect(validateSlug('post-')).toBe(false);
  });

  it('rejects slugs with consecutive hyphens', () => {
    expect(validateSlug('post--one')).toBe(false);
  });
});
