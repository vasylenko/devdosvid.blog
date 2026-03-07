import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import MDEditor from '@uiw/react-md-editor';
import { fetchPost, updatePost, fetchSeries } from '../api/client';
import ImageUploader from './ImageUploader';

export default function PostEditor() {
  const { year, slug } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);

  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');
  const [draft, setDraft] = useState(false);
  const [keywords, setKeywords] = useState('');
  const [series, setSeries] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [coverAlt, setCoverAlt] = useState('');
  const [body, setBody] = useState('');

  const [seriesOptions, setSeriesOptions] = useState([]);

  useEffect(() => {
    Promise.all([fetchPost(year, slug), fetchSeries()])
      .then(([post, seriesList]) => {
        const fm = post.frontMatter;
        setTitle(fm.title || '');
        setDate(fm.date || '');
        setSummary(fm.summary || '');
        setDescription(fm.description || '');
        setDraft(fm.draft || false);
        setKeywords(Array.isArray(fm.keywords) ? fm.keywords.join(', ') : '');
        const seriesVal = Array.isArray(fm.series) ? fm.series[0] || '' : fm.series || '';
        setSeries(seriesVal);
        setCoverImage(fm.cover?.image || '');
        setCoverAlt(fm.cover?.alt || '');
        setBody(post.body || '');
        setSeriesOptions(seriesList || []);
      })
      .catch(err => setStatus(`Error loading post: ${err.message}`))
      .finally(() => setLoading(false));
  }, [year, slug]);

  const save = useCallback(async () => {
    setSaving(true);
    setStatus(null);
    try {
      const frontMatter = {
        title,
        date,
        summary: summary || '',
        description: description || '',
        draft,
        keywords: keywords ? keywords.split(',').map(k => k.trim()).filter(Boolean) : [],
        series: series || '',
        cover: {
          image: coverImage || 'cover.png',
          relative: true,
          alt: coverAlt || '',
        },
      };
      await updatePost(year, slug, { frontMatter, body });
      setStatus('Saved');
      setTimeout(() => setStatus(null), 2000);
    } catch (err) {
      setStatus(`Save failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }, [year, slug, title, date, summary, description, draft, keywords, series, coverImage, coverAlt, body]);

  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        save();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [save]);

  const handleInsertImage = useCallback((shortcode) => {
    setBody(prev => prev + '\n' + shortcode);
  }, []);

  const handleSetCover = useCallback((filename) => {
    setCoverImage(filename);
  }, []);

  if (loading) return <p className="loading">Loading post...</p>;

  return (
    <div className="editor">
      <div className="editor-toolbar">
        <h1 className="editor-title">{title || 'Untitled'}</h1>
        <div className="editor-actions">
          {status && (
            <span className={status === 'Saved' ? 'status-success' : 'status-error'}>
              {status}
            </span>
          )}
          <button className="btn-primary" onClick={save} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      <div className="front-matter-grid">
        <label className="field full-width">
          <span>Title</span>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} />
        </label>

        <label className="field">
          <span>Summary</span>
          <textarea rows={2} value={summary} onChange={e => setSummary(e.target.value)} />
        </label>

        <label className="field">
          <span>Description</span>
          <textarea rows={2} value={description} onChange={e => setDescription(e.target.value)} />
        </label>

        <label className="field">
          <span>Series</span>
          <select value={series} onChange={e => setSeries(e.target.value)}>
            <option value="">None</option>
            {seriesOptions.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Keywords (comma-separated)</span>
          <input type="text" value={keywords} onChange={e => setKeywords(e.target.value)} />
        </label>

        <label className="field">
          <span>Cover Alt Text</span>
          <input type="text" value={coverAlt} onChange={e => setCoverAlt(e.target.value)} />
        </label>

        <label className="field">
          <span>Cover Image</span>
          <input type="text" value={coverImage} readOnly />
        </label>

        <label className="field">
          <span>Date</span>
          <input type="text" value={date ? new Date(date).toLocaleDateString() : ''} readOnly />
        </label>

        <label className="field field-checkbox">
          <input type="checkbox" checked={draft} onChange={e => setDraft(e.target.checked)} />
          <span>Draft</span>
        </label>
      </div>

      <div className="editor-body" data-color-mode="light">
        <MDEditor
          value={body}
          onChange={setBody}
          height={500}
          preview="edit"
        />
      </div>

      <ImageUploader
        year={year}
        slug={slug}
        onInsert={handleInsertImage}
        onSetCover={handleSetCover}
      />
    </div>
  );
}
