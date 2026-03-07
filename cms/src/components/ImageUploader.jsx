import { useState, useEffect, useRef } from 'react';
import { fetchImages, uploadImage } from '../api/client';

export default function ImageUploader({ year, slug, onInsert, onSetCover }) {
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  useEffect(() => {
    loadImages();
  }, [year, slug]);

  async function loadImages() {
    try {
      const data = await fetchImages(year, slug);
      setImages(data.images || []);
    } catch {
      setImages([]);
    }
  }

  async function handleUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      await uploadImage(year, slug, file);
      await loadImages();
    } catch (err) {
      alert(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
      fileRef.current.value = '';
    }
  }

  function handleInsert(filename) {
    onInsert(`{{< figure src="${filename}" >}}`);
  }

  return (
    <div className="image-panel">
      <div className="image-panel-header">
        <h3>Images</h3>
        <button
          className="btn-primary btn-small"
          onClick={() => fileRef.current.click()}
          disabled={uploading}
        >
          {uploading ? 'Uploading...' : 'Upload Image'}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={handleUpload}
          hidden
        />
      </div>
      {images.length > 0 && (
        <div className="image-list">
          {images.map(img => (
            <div key={img} className="image-item">
              <img
                src={`/api/posts/${year}/${slug}/images/${img}`}
                alt={img}
                className="image-thumb"
                onClick={() => handleInsert(img)}
                title="Click to insert into editor"
              />
              <div className="image-name">{img}</div>
              <button
                className="btn-link"
                onClick={() => onSetCover(img)}
                title="Set as cover image"
              >
                Set Cover
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
