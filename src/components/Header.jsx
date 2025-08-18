import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { CartContext } from './CartContext';
import '../assets/App.css';

const Header = ({ isLoggedIn, isAdmin, onLogout, userData }) => {
  const { totalItems } = useContext(CartContext);

  return (
    <header className="header">
      <div className="header-content">
        <Link to="/" className="logo">
          Fast And Trust
        </Link>
        <nav className="nav-links">
          <Link to="/" className="nav-link">Main</Link>
          {isLoggedIn ? (
            <>
              {isAdmin && <Link to="/admin" className="nav-link">Admin Panel</Link>}
              <Link to="/cart" className="nav-link cart-link">Cart ({totalItems})</Link>
              <div className="user-info">
                <span className="user-email">{userData?.email}</span>
                <button onClick={onLogout} className="logout-btn">Sign Out</button>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">Sign In</Link>
              <Link to="/cart" className="nav-link cart-link">Cart ({totalItems})</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;