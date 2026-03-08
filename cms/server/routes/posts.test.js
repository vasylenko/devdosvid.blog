import { describe, it, expect } from 'vitest';
import { generateSlug } from './posts.js';

describe('generateSlug', () => {
  it('converts title to lowercase kebab-case', () => {
    expect(generateSlug('My First Post')).toBe('my-first-post');
  });

  it('strips leading and trailing hyphens', () => {
    expect(generateSlug('---hello---')).toBe('hello');
  });

  it('collapses consecutive non-alphanumeric characters', () => {
    expect(generateSlug('hello   world!!!')).toBe('hello-world');
  });

  it('handles titles with numbers', () => {
    expect(generateSlug('Top 10 Tips for 2025')).toBe('top-10-tips-for-2025');
  });

  it('returns empty string for non-Latin-only titles', () => {
    expect(generateSlug('Привіт Світ')).toBe('');
  });

  it('handles mixed Latin and non-Latin characters', () => {
    expect(generateSlug('Hello Світ')).toBe('hello');
  });

  it('handles special characters', () => {
    expect(generateSlug("What's New? A Developer's Guide!")).toBe('what-s-new-a-developer-s-guide');
  });
});
