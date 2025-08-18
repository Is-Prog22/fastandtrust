import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { CartContext } from './CartContext';
import '../assets/CartPage.css';

const BASE_IMAGE_URL = process.env.REACT_APP_IMAGE_URL; // отдельный URL для картинок

const CartPage = () => {
  const { cart, removeFromCart, updateQuantity, clearCart } = useContext(CartContext);

  const totalPrice = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <div className="cart-page">
      <h1>Your Cart</h1>

      {cart.length === 0 ? (
        <div className="empty-cart">
          <p>Your cart is empty</p>
          <Link to="/" className="continue-shopping">
            continue purchasing
          </Link>
        </div>
      ) : (
        <>
          <div className="cart-items">
            {cart.map((item) => (
              <div key={item.id} className="cart-item">
                {item.images && item.images.length > 0 && (
                  <img
                    src={`${BASE_IMAGE_URL}${item.images[0]}`}
                    alt={item.name}
                    className="cart-item-image"
                  />
                )}
                <div className="cart-item-details">
                  <h3>{item.name}</h3>
                  <p>Price: {item.price} ₼</p>
                  <div className="quantity-controls">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                    >
                      -
                    </button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                      +
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="remove-item"
                  title="Delete item"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <h3>Total: {totalPrice} ₼</h3>
            <div className="cart-actions">
              <button onClick={clearCart} className="clear-cart">
                Clear Cart
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CartPage;