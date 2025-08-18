import React from 'react';
import { Link } from 'react-router-dom';
import '../assets/App.css';

const Home = ({ categories }) => {
  return (
    <div className="home">
      <div className="hero">
        <h1>Welcome To Fast And Trust</h1>
        <p>Reliable store of quality products for you</p>
      </div>
      
      <div className="categories-grid">
        {categories.map(category => (
          <Link 
            key={category.id} 
            to={`/category/${category.id}`} 
            className="category-card"
          >
            <div className="category-image">
              {category.name.charAt(0)}
            </div>
            <h3 className="category-name">{category.name}</h3>
            <p className="category-description">
              Wide selection of products in the category {category.name}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Home;