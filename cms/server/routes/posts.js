import { Router } from 'express';
import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import yaml from 'js-yaml';
import { CONTENT_DIR } from '../config.js';

const router = Router();

// Use JSON_SCHEMA to prevent js-yaml from auto-converting date strings to Date objects
const matterOptions = {
  engines: {
    yaml: {
      parse: (str) => yaml.load(str, { schema: yaml.JSON_SCHEMA }),
      stringify: (obj) => yaml.dump(obj, { schema: yaml.JSON_SCHEMA, lineWidth: -1 }),
    },
  },
};

async function findPostFiles() {
  const postsDir = path.join(CONTENT_DIR, 'posts');
  const entries = await fs.readdir(postsDir, { recursive: true });
  return entries
    .filter(entry => entry.endsWith('index.md'))
    .map(entry => ({
      fullPath: path.join(postsDir, entry),
      parts: entry.split(path.sep),
    }));
}

router.get('/posts', async (req, res) => {
  try {
    const postFiles = await findPostFiles();
    const posts = await Promise.all(
      postFiles.map(async ({ fullPath, parts }) => {
        const content = await fs.readFile(fullPath, 'utf-8');
        const { data } = matter(content, matterOptions);
        const year = parts[0];
        const slug = parts[1];
        return {
          title: data.title || '',
          date: data.date || '',
          summary: data.summary || '',
          draft: data.draft || false,
          year,
          slug,
          series: data.series || '',
          hasCover: !!(data.cover && data.cover.image),
        };
      })
    );
    posts.sort((a, b) => new Date(b.date) - new Date(a.date));
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/posts/:year/:slug', async (req, res) => {
  try {
    const filePath = path.join(CONTENT_DIR, 'posts', req.params.year, req.params.slug, 'index.md');
    const content = await fs.readFile(filePath, 'utf-8');
    const { data, content: body } = matter(content, matterOptions);
    res.json({ frontMatter: data, body });
  } catch (err) {
    if (err.code === 'ENOENT') {
      return res.status(404).json({ error: 'Post not found' });
    }
    res.status(500).json({ error: err.message });
  }
});

router.post('/posts', async (req, res) => {
  try {
    const { title } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const year = String(new Date().getFullYear());
    const postDir = path.join(CONTENT_DIR, 'posts', year, slug);
    await fs.mkdir(postDir, { recursive: true });

    const frontMatter = {
      title,
      date: new Date().toISOString().replace('Z', '+01:00'),
      summary: '',
      description: '',
      cover: {
        image: 'cover.png',
        relative: true,
        alt: '',
      },
      draft: true,
      keywords: [],
      series: '',
    };
    const fileContent = matter.stringify('\n', frontMatter, matterOptions);
    await fs.writeFile(path.join(postDir, 'index.md'), fileContent);
    res.status(201).json({ year, slug });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/posts/:year/:slug', async (req, res) => {
  try {
    const { frontMatter, body } = req.body;
    const filePath = path.join(CONTENT_DIR, 'posts', req.params.year, req.params.slug, 'index.md');
    const fileContent = matter.stringify(body || '', frontMatter, matterOptions);
    await fs.writeFile(filePath, fileContent);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/series', async (req, res) => {
  try {
    const knownSeries = ['Engineering Leadership', 'Terraform Proficiency', 'mac1.metal at AWS'];
    const postFiles = await findPostFiles();
    const allSeries = new Set(knownSeries);

    await Promise.all(
      postFiles.map(async ({ fullPath }) => {
        const content = await fs.readFile(fullPath, 'utf-8');
        const { data } = matter(content, matterOptions);
        if (Array.isArray(data.series)) {
          data.series.forEach(s => allSeries.add(s));
        } else if (data.series) {
          allSeries.add(data.series);
        }
      })
    );

    res.json([...allSeries].sort());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
