import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchPosts, createPost } from '../api/client';

export default function PostList() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPosts()
      .then(setPosts)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleNewPost() {
    const title = window.prompt('Enter post title:');
    if (!title) return;

    try {
      const { year, slug } = await createPost(title);
      navigate(`/edit/${year}/${slug}`);
    } catch (err) {
      alert(`Failed to create post: ${err.message}`);
    }
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  if (loading) return <p className="loading">Loading posts...</p>;
  if (error) return <p className="error">Error: {error}</p>;

  return (
    <div>
      <div className="page-header">
        <h1>Posts</h1>
        <button className="btn-primary" onClick={handleNewPost}>New Post</button>
      </div>
      {posts.length === 0 ? (
        <p>No posts yet. Create your first one!</p>
      ) : (
        <table className="post-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Date</th>
              <th>Series</th>
              <th>Draft</th>
            </tr>
          </thead>
          <tbody>
            {posts.map(post => (
              <tr key={`${post.year}/${post.slug}`}>
                <td>
                  <Link to={`/edit/${post.year}/${post.slug}`}>{post.title}</Link>
                </td>
                <td>{formatDate(post.date)}</td>
                <td>{Array.isArray(post.series) ? post.series.join(', ') : post.series || ''}</td>
                <td>
                  {post.draft && <span className="badge-draft">Draft</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
