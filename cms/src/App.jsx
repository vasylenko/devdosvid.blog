import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import PostList from './components/PostList';
import PostEditor from './components/PostEditor';

function Layout({ children }) {
  const location = useLocation();
  const isEditor = location.pathname.startsWith('/edit/');

  if (isEditor) {
    return <>{children}</>;
  }

  return (
    <>
      <nav className="navbar">
        <Link to="/" className="navbar-title">devDosvid CMS</Link>
        <Link to="/" className="navbar-link">Posts</Link>
      </nav>
      <main className="container">
        {children}
      </main>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<PostList />} />
          <Route path="/edit/:year/:slug" element={<PostEditor />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
