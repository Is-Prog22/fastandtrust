import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, LogIn } from 'lucide-react'; // или твой пакет
import '../assets/Login.css';


const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const ADMIN_EMAIL = process.env.REACT_APP_ADMIN_EMAIL?.toLowerCase();
  const ADMIN_NAME = process.env.REACT_APP_ADMIN_NAME?.toLowerCase();

  const validateForm = () => {
    const newErrors = {};
    if (!username) {
      newErrors.username = 'Name is required';
    } else if (!/^[A-Za-zА-Яа-яЁё]{3,}$/.test(username)) {
      newErrors.username = 'The name must contain only letters and be at least 3 characters long.';
    }
    if (!email) {
      newErrors.email = 'Email обязателен';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Введите корректный email';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onLogin(email, username);
      if (email.toLowerCase() === ADMIN_EMAIL && username.toLowerCase() === ADMIN_NAME) {
        navigate('/admin');
      } else {
        navigate('/');
      }
    }
  };

  return (
    <div className="login-container">
      <h2>Stay In Touch With Us</h2>
      <form onSubmit={handleSubmit} className="login-form">
        <div className="form-group">
          <label htmlFor="username" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <User size={20} /> Name:
          </label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => {
              const val = e.target.value.replace(/[^A-Za-zА-Яа-яЁё]/g, '');
              setUsername(val);
            }}
            placeholder="Enter name (letters only, at least 3)"
            className={errors.username ? 'error' : ''}
            required
          />
          {errors.username && <span className="error-message" style={{ color: 'red', fontSize: '0.85rem' }}>{errors.username}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="email" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Mail size={20} /> Email:
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className={errors.email ? 'error' : ''}
            required
          />
          {errors.email && <span className="error-message" style={{ color: 'red', fontSize: '0.85rem' }}>{errors.email}</span>}
        </div>

        <button type="submit" className="login-btn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <LogIn size={20} /> Subscribe
        </button>
      </form>
    </div>
  );
};

export default Login;