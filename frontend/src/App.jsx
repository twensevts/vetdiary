import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Forum from './pages/Forum';
import Care from './pages/Care';
import Pets from './pages/Pets';

function AppLayout() {
  const location = useLocation();
  const token = localStorage.getItem('token');
  const showNavbar = Boolean(token) && location.pathname !== '/' && location.pathname !== '/register';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {showNavbar && <Navbar />}
      <main style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/pets" element={<Pets />} />
          <Route path="/pets/:id" element={<Pets />} />
          <Route path="/forum" element={<Forum />} />
          <Route path="/care" element={<Care />} />
        </Routes>
      </main>
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