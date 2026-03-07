import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import PostList from './components/PostList';
import PostEditor from './components/PostEditor';

export default function App() {
  return (
    <BrowserRouter>
      <nav className="navbar">
        <Link to="/" className="navbar-title">devDosvid CMS</Link>
        <Link to="/" className="navbar-link">Posts</Link>
      </nav>
      <main className="container">
        <Routes>
          <Route path="/" element={<PostList />} />
          <Route path="/edit/:year/:slug" element={<PostEditor />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
