import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.tsx';
import Auth from './components/Auth.tsx';
import Chat from './components/Chat.tsx';

const App = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/threads" replace /> : <Auth initialView="login" />}
      />
      <Route
        path="/register"
        element={isAuthenticated ? <Navigate to="/threads" replace /> : <Auth initialView="register" />}
      />
      <Route
        path="/threads"
        element={isAuthenticated ? <Chat /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/threads/:threadId"
        element={isAuthenticated ? <Chat /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/"
        element={<Navigate to={isAuthenticated ? '/threads' : '/login'} replace />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
