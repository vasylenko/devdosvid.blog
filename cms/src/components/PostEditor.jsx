import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router';
import MDEditor from '@uiw/react-md-editor';
import { fetchPost, updatePost, fetchSeries } from '../api/client';
import ImageUploader from './ImageUploader';
import ShortcodeToolbar from './ShortcodeToolbar';

export default function PostEditor() {
  const { year, slug } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);

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
  const editorRef = useRef(null);

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
      .catch(err => setSaveMessage(`Error loading post: ${err.message}`))
      .finally(() => setLoading(false));
  }, [year, slug]);

  const save = useCallback(async () => {
    setSaving(true);
    setSaveMessage(null);
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
      setSaveMessage('Saved');
      setTimeout(() => setSaveMessage(null), 2000);
    } catch (err) {
      setSaveMessage(`Save failed: ${err.message}`);
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

  const insertAtCursor = useCallback((text) => {
    const textarea = editorRef.current?.querySelector('textarea');
    if (!textarea) {
      setBody(prev => prev + '\n' + text);
      return;
    }
    const { selectionStart, selectionEnd } = textarea;
    setBody(prev => prev.slice(0, selectionStart) + text + prev.slice(selectionEnd));
    // Restore focus and cursor position after React re-render
    requestAnimationFrame(() => {
      textarea.focus();
      const newPos = selectionStart + text.length;
      textarea.setSelectionRange(newPos, newPos);
    });
  }, []);

  if (loading) return <p className="loading">Loading post...</p>;

  return (
    <div className="editor-page">
      <div className="editor-viewport">
        {/* Compact toolbar */}
        <div className="editor-toolbar">
          <Link to="/" className="toolbar-back">← Posts</Link>
          <div className="toolbar-right">
            <label className="draft-toggle">
              <input
                type="checkbox"
                checked={draft}
                onChange={e => setDraft(e.target.checked)}
              />
              <span className={`draft-pill ${draft ? 'is-draft' : 'is-published'}`}>
                {draft ? 'Draft' : 'Published'}
              </span>
            </label>
            {saveMessage && (
              <span className={saveMessage === 'Saved' ? 'status-success' : 'status-error'}>
                {saveMessage}
              </span>
            )}
            <button className="btn-save" onClick={save} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        {/* Inline title */}
        <input
          className="editor-title-input"
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Post title..."
        />

        {/* Shortcode toolbar */}
        <ShortcodeToolbar onInsert={insertAtCursor} />

        {/* Markdown editor fills remaining space */}
        <div className="editor-body" data-color-mode="light" ref={editorRef}>
          <MDEditor
            value={body}
            onChange={setBody}
            preview="edit"
          />
        </div>
      </div>

      {/* Below-the-fold sections */}
      <details className="editor-section">
        <summary className="editor-section-summary">Images</summary>
        <div className="editor-section-content">
          <ImageUploader
            year={year}
            slug={slug}
            onInsert={insertAtCursor}
            onSetCover={setCoverImage}
          />
        </div>
      </details>

      <details className="editor-section">
        <summary className="editor-section-summary">Metadata</summary>
        <div className="editor-section-content">
          <div className="metadata-grid">
            <label className="field full-width">
              <span>Summary</span>
              <textarea rows={2} value={summary} onChange={e => setSummary(e.target.value)} />
            </label>

            <label className="field full-width">
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
              <span>Cover Image</span>
              <input type="text" value={coverImage} readOnly />
            </label>

            <label className="field">
              <span>Cover Alt Text</span>
              <input type="text" value={coverAlt} onChange={e => setCoverAlt(e.target.value)} />
            </label>

            <label className="field">
              <span>Date</span>
              <input type="text" value={date ? new Date(date).toLocaleDateString() : ''} readOnly />
            </label>
          </div>
        </div>
      </details>
    </div>
  );
}
