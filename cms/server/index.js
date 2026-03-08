import express from 'express';
import path from 'path';
import fs from 'fs';
import { CONTENT_DIR } from './config.js';
import postRoutes from './routes/posts.js';
import imageRoutes from './routes/images.js';
import shortcodeRoutes from './routes/shortcodes.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use('/api', postRoutes);
app.use('/api', imageRoutes);
app.use('/api', shortcodeRoutes);

const distPath = path.resolve(import.meta.dirname, '../dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`CMS server running on http://localhost:${PORT}`);
  console.log(`Content directory: ${CONTENT_DIR}`);
});
