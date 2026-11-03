import { Navigate, Route, Routes } from 'react-router-dom';
import { AppProvider, useApp } from './context.jsx';
import SmoothScroll from './components/SmoothScroll.jsx';
import { Toaster } from './components/Toast.jsx';
import Layout from './components/Layout.jsx';
import Home from './pages/Home.jsx';
import Services from './pages/Services.jsx';
import Gallery from './pages/Gallery.jsx';
import Training from './pages/Training.jsx';
import Book from './pages/Book.jsx';
import Contact from './pages/Contact.jsx';
import Auth from './pages/Auth.jsx';
import Account from './pages/Account.jsx';
import Admin from './pages/Admin.jsx';

function Shell() {
  const { site } = useApp();
  if (!site) return <div className="boot" role="status" aria-label="Loading"><span /></div>;
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="services" element={<Services />} />
        <Route path="gallery" element={<Gallery />} />
        <Route path="training" element={<Training />} />
        <Route path="book" element={<Book />} />
        <Route path="contact" element={<Contact />} />
        <Route path="login" element={<Auth mode="login" />} />
        <Route path="register" element={<Auth mode="register" />} />
        <Route path="account" element={<Account />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
      <Route path="admin" element={<Admin />} />
      <Route path="admin/:tab" element={<Admin />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AppProvider>
      <SmoothScroll />
      <Shell />
      <Toaster />
    </AppProvider>
  );
}
