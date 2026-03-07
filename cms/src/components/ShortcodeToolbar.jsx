import { useState, useEffect } from 'react';
import { fetchShortcodes } from '../api/client';

function buildSnippet(shortcode) {
  const params = shortcode.params.map(p => `${p}=""`).join(' ');
  const tag = params ? `${shortcode.name} ${params}` : shortcode.name;

  if (shortcode.hasInner) {
    return `{{< ${tag} >}}\n\n{{< /${shortcode.name} >}}`;
  }
  return `{{< ${tag} >}}`;
}

export default function ShortcodeToolbar({ onInsert }) {
  const [shortcodes, setShortcodes] = useState([]);

  useEffect(() => {
    fetchShortcodes()
      .then(setShortcodes)
      .catch(() => setShortcodes([]));
  }, []);

  if (shortcodes.length === 0) return null;

  return (
    <div className="shortcode-toolbar">
      <span className="shortcode-label">Shortcodes</span>
      {shortcodes.map(sc => (
        <button
          key={sc.name}
          className="shortcode-btn"
          onClick={() => onInsert(buildSnippet(sc))}
          title={sc.params.length > 0
            ? `${sc.name}(${sc.params.join(', ')})${sc.hasInner ? ' [paired]' : ''}`
            : `${sc.name}${sc.hasInner ? ' [paired]' : ''}`}
        >
          {sc.name}
        </button>
      ))}
    </div>
  );
}
