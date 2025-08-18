import React from 'react';
import { Link } from 'react-router-dom';
import '../assets/Footer.css';
import '../assets/About.css';

const Footer = () => (
  <footer className="footer">
    <nav className="footer-links">
      <Link to="/about" className="footer-link">About Us</Link>
      <Link to="/advertising" className="footer-link">Advertising</Link>
      <Link to="/privacy" className="footer-link">Policy</Link>
    </nav>
    <div className="footer-rights">
      <span>© {new Date().getFullYear()} Fast And Trust. All rights reserved.</span>
    </div>
  </footer>
);

export default Footer;