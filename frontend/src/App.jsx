import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Forum from './pages/Forum';
import Care from './pages/Care';
import Pets from './pages/Pets';
import Profile from './pages/Profile';
import Admin from './pages/Admin';

function AppLayout() {
  const location = useLocation();
  const token = localStorage.getItem('token');
  const hideNavbarPaths = ['/', '/register', '/forum'];
  const showNavbar = Boolean(token) || (!token && !hideNavbarPaths.includes(location.pathname));

  const shouldShowNavbar = (Boolean(token) && location.pathname !== '/' && location.pathname !== '/register') || (!token && location.pathname === '/forum');

  return (
    <div className="app-hero">
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {shouldShowNavbar && <Navbar />}
        <main className="container" style={{ paddingTop: '28px' }}>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/pets" element={<Pets />} />
            <Route path="/pets/:id" element={<Pets />} />
            <Route path="/forum" element={<Forum />} />
            <Route path="/care" element={<Care />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppLayout />
    </Router>
  );
}

export default App;