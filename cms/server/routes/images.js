import { Router } from 'express';
import fs from 'fs/promises';
import path from 'path';
import multer from 'multer';
import { CONTENT_DIR } from '../config.js';

const router = Router();

const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg']);

const storage = multer.diskStorage({
  destination(req, file, cb) {
    const dir = path.join(CONTENT_DIR, 'posts', req.params.year, req.params.slug);
    cb(null, dir);
  },
  filename(req, file, cb) {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage });

router.post('/posts/:year/:slug/images', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image uploaded' });
  }
  res.json({ filename: req.file.originalname });
});

router.get('/posts/:year/:slug/images/:filename', (req, res) => {
  const filePath = path.join(CONTENT_DIR, 'posts', req.params.year, req.params.slug, req.params.filename);
  res.sendFile(filePath);
});

router.get('/posts/:year/:slug/images', async (req, res) => {
  try {
    const dir = path.join(CONTENT_DIR, 'posts', req.params.year, req.params.slug);
    const entries = await fs.readdir(dir);
    const images = entries.filter(f => IMAGE_EXTENSIONS.has(path.extname(f).toLowerCase()));
    res.json({ images });
  } catch (err) {
    if (err.code === 'ENOENT') {
      return res.status(404).json({ error: 'Post directory not found' });
    }
    res.status(500).json({ error: err.message });
  }
});

export default router;
