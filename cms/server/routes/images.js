import { Router } from 'express';
import fs from 'fs/promises';
import path from 'path';
import multer from 'multer';
import { postDir, validateRouteParams, sanitizeFilename } from '../config.js';

const router = Router();

const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg']);

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, postDir(req.params.year, req.params.slug));
  },
  filename(req, file, cb) {
    cb(null, sanitizeFilename(file.originalname));
  },
});

function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!IMAGE_EXTENSIONS.has(ext)) {
    return cb(new Error(`File type ${ext} is not allowed. Accepted: ${[...IMAGE_EXTENSIONS].join(', ')}`));
  }
  cb(null, true);
}

const upload = multer({ storage, fileFilter });

router.post('/posts/:year/:slug/images', (req, res) => {
  if (!validateRouteParams(req, res)) return;
  upload.single('image')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }
    res.json({ filename: req.file.filename });
  });
});

router.get('/posts/:year/:slug/images/:filename', (req, res) => {
  if (!validateRouteParams(req, res)) return;
  const safe = sanitizeFilename(req.params.filename);
  const filePath = path.join(postDir(req.params.year, req.params.slug), safe);
  res.sendFile(filePath);
});

router.get('/posts/:year/:slug/images', async (req, res) => {
  if (!validateRouteParams(req, res)) return;
  try {
    const dir = postDir(req.params.year, req.params.slug);
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
