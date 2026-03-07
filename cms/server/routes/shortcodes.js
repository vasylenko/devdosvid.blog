import { Router } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { SHORTCODES_DIR } from '../config.js';

const router = Router();

function parseShortcodeTemplate(content) {
  // Extract named parameters from .Get "param" calls
  const paramMatches = content.matchAll(/\.Get\s+"([^"]+)"/g);
  const params = [...new Set([...paramMatches].map(m => m[1]))];

  // Detect paired shortcodes by checking for .Inner usage
  const hasInner = /\.Inner\b/.test(content);

  return { params, hasInner };
}

router.get('/shortcodes', async (req, res) => {
  try {
    const entries = await fs.readdir(SHORTCODES_DIR);
    const shortcodes = await Promise.all(
      entries
        .filter(f => f.endsWith('.html'))
        .map(async (filename) => {
          const name = filename.replace('.html', '');
          const content = await fs.readFile(path.join(SHORTCODES_DIR, filename), 'utf-8');
          const { params, hasInner } = parseShortcodeTemplate(content);
          return { name, params, hasInner };
        })
    );
    shortcodes.sort((a, b) => a.name.localeCompare(b.name));
    res.json(shortcodes);
  } catch (err) {
    if (err.code === 'ENOENT') {
      return res.json([]);
    }
    res.status(500).json({ error: err.message });
  }
});

export default router;
