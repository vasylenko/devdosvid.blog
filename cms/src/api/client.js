const API_BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed: ${res.status}`);
  }
  return res.json();
}

export async function fetchPosts() {
  return request('/posts');
}

export async function fetchPost(year, slug) {
  return request(`/posts/${year}/${slug}`);
}

export async function createPost(title) {
  return request('/posts', {
    method: 'POST',
    body: JSON.stringify({ title }),
  });
}

export async function updatePost(year, slug, data) {
  return request(`/posts/${year}/${slug}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function uploadImage(year, slug, file) {
  const formData = new FormData();
  formData.append('image', file);
  const res = await fetch(`${API_BASE}/posts/${year}/${slug}/images`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Upload failed: ${res.status}`);
  }
  return res.json();
}

export async function fetchImages(year, slug) {
  return request(`/posts/${year}/${slug}/images`);
}

export async function fetchSeries() {
  return request('/series');
}
