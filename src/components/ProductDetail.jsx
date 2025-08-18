import React, { useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CartContext } from './CartContext';
import '../assets/ProductDetail.css';

const BASE_IMAGE_URL = process.env.REACT_APP_IMAGE_URL; // Только для картинок

const ProductDetail = ({ products }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useContext(CartContext);

  const product = products.find(p => p.id === parseInt(id));
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  if (!product) return <div className="not-found">Product not found</div>;

  const showPrevImage = () => {
    setIsZoomed(false);
    setCurrentImageIndex(prev =>
      prev === 0 ? product.images.length - 1 : prev - 1
    );
  };

  const showNextImage = () => {
    setIsZoomed(false);
    setCurrentImageIndex(prev =>
      prev === product.images.length - 1 ? 0 : prev + 1
    );
  };

  const toggleZoom = () => setIsZoomed(!isZoomed);

  const handleAddToCart = () => {
    addToCart(product);
    navigate('/cart');
  };

  return (
    <div className="product-modal-overlay">
      <div className="product-modal">
        <div className="product-modal-left">
          {product.images && product.images.length > 0 && (
            <img
              src={`${BASE_IMAGE_URL}${product.images[currentImageIndex]}`}
              alt={product.name}
              className={`product-modal-image ${isZoomed ? 'zoomed' : ''}`}
              onClick={toggleZoom}
            />
          )}
          <button className="modal-arrow left" onClick={showPrevImage}>&lsaquo;</button>
          <button className="modal-arrow right" onClick={showNextImage}>&rsaquo;</button>

          <div className="product-thumbnails">
            {product.images.map((img, index) => (
              <img
                key={index}
                src={`${BASE_IMAGE_URL}${img}`}
                alt={`Thumbnail ${index + 1}`}
                className={`thumbnail ${index === currentImageIndex ? 'active' : ''}`}
                onClick={() => {
                  setCurrentImageIndex(index);
                  setIsZoomed(false);
                }}
              />
            ))}
          </div>
        </div>

        <div className="product-modal-right">
          <h1 className="product-modal-title">{product.name}</h1>
          <div className="product-modal-price">{product.price} AZN</div>

          <div className="description-container">
            <div className="description-text">{product.description}</div>
          </div>

          <div className="modal-actions">
            <button onClick={() => navigate(-1)} className="back-btn">Back</button>
            <button onClick={handleAddToCart} className="add-to-cart-btn">Add To Cart</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;