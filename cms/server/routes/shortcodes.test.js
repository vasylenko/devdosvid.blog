import { describe, it, expect } from 'vitest';
import { parseShortcodeTemplate } from './shortcodes.js';

describe('parseShortcodeTemplate', () => {
  it('extracts params from cms annotation', () => {
    const content = '{{/* cms: src, alt, caption */}}\n{{ .Get "src" }}{{ .Get "alt" }}';
    const result = parseShortcodeTemplate(content);
    expect(result.params).toEqual(['src', 'alt', 'caption']);
  });

  it('falls back to .Get scanning when no cms annotation', () => {
    const content = '{{ .Get "src" }} {{ .Get "alt" }}';
    const result = parseShortcodeTemplate(content);
    expect(result.params).toEqual(['src', 'alt']);
  });

  it('deduplicates .Get params in fallback mode', () => {
    const content = '{{ .Get "src" }} {{ .Get "src" }} {{ .Get "alt" }}';
    const result = parseShortcodeTemplate(content);
    expect(result.params).toEqual(['src', 'alt']);
  });

  it('detects paired shortcodes via .Inner', () => {
    const content = '{{ .Get "class" }}{{ .Inner }}';
    const result = parseShortcodeTemplate(content);
    expect(result.hasInner).toBe(true);
  });

  it('detects non-paired shortcodes', () => {
    const content = '{{ .Get "src" }}';
    const result = parseShortcodeTemplate(content);
    expect(result.hasInner).toBe(false);
  });

  it('returns empty params for template with no .Get calls and no annotation', () => {
    const content = '<div>{{ .Page.Title }}</div>';
    const result = parseShortcodeTemplate(content);
    expect(result.params).toEqual([]);
  });

  it('handles cms annotation with extra whitespace', () => {
    const content = '{{/*   cms:   src ,  alt  ,  caption   */}}';
    const result = parseShortcodeTemplate(content);
    expect(result.params).toEqual(['src', 'alt', 'caption']);
  });
});
