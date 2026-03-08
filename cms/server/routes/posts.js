import { Router } from 'express';
import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import yaml from 'js-yaml';
import { CONTENT_DIR, postDir, postFile, validateRouteParams } from '../config.js';

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

function normalizeSeries(value) {
  return Array.isArray(value) ? value : value ? [value] : [];
}

export function generateSlug(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

async function findPostFiles() {
  const postsDir = path.join(CONTENT_DIR, 'posts');
  const entries = await fs.readdir(postsDir, { recursive: true });
  return entries
    .filter(entry => entry.endsWith('index.md'))
    .map(entry => {
      const parts = entry.split(path.sep);
      return { fullPath: path.join(postsDir, entry), year: parts[0], slug: parts[1] };
    });
}

router.get('/posts', async (req, res) => {
  try {
    const postFiles = await findPostFiles();
    const posts = await Promise.all(
      postFiles.map(async ({ fullPath, year, slug }) => {
        const content = await fs.readFile(fullPath, 'utf-8');
        const { data } = matter(content, matterOptions);
        return {
          title: data.title || '',
          date: data.date || '',
          summary: data.summary || '',
          draft: data.draft || false,
          year,
          slug,
          series: normalizeSeries(data.series),
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
  if (!validateRouteParams(req, res)) return;
  try {
    const filePath = postFile(req.params.year, req.params.slug);
    const content = await fs.readFile(filePath, 'utf-8');
    const { data, content: body } = matter(content, matterOptions);
    res.json({ frontMatter: { ...data, series: normalizeSeries(data.series) }, body });
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
    const slug = generateSlug(title);
    if (!slug) {
      return res.status(400).json({ error: 'Title must contain at least one Latin letter or digit' });
    }
    const year = String(new Date().getFullYear());
    const dir = postDir(year, slug);
    await fs.mkdir(dir, { recursive: true });

    const frontMatter = {
      title,
      date: new Date().toISOString(),
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
    await fs.writeFile(postFile(year, slug), fileContent);
    res.status(201).json({ year, slug });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/posts/:year/:slug', async (req, res) => {
  if (!validateRouteParams(req, res)) return;
  try {
    const { frontMatter, body } = req.body;
    if (!frontMatter || typeof frontMatter !== 'object' || !frontMatter.title) {
      return res.status(400).json({ error: 'Valid frontMatter with title is required' });
    }
    const filePath = postFile(req.params.year, req.params.slug);
    const fileContent = matter.stringify(body || '', frontMatter, matterOptions);
    await fs.writeFile(filePath, fileContent);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/series', async (req, res) => {
  try {
    const postFiles = await findPostFiles();
    const allSeries = new Set();

    await Promise.all(
      postFiles.map(async ({ fullPath }) => {
        const content = await fs.readFile(fullPath, 'utf-8');
        const { data } = matter(content, matterOptions);
        const series = normalizeSeries(data.series);
        series.forEach(s => allSeries.add(s));
      })
    );

    res.json([...allSeries].sort());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
