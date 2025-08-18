import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import '../assets/App.css';
import Header from './Header';
import Home from './Home';
import Category from './Category';
import Login from './Login';
import AdminPanel from './AdminPanel';
import ProductDetail from './ProductDetail';
import CartPage from './CartPage';
import { CartProvider } from './CartContext';
import Footer from './Footer';
import About from './About';
import Advertising from './Advertising';
import Privacy from './Privacy';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userData, setUserData] = useState(null);

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);

  const API_URL = process.env.REACT_APP_API_URL; 
  const adminEmail = process.env.REACT_APP_ADMIN_EMAIL?.toLowerCase();
  const adminUsername = process.env.REACT_APP_ADMIN_NAME?.toLowerCase();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, catRes, userRes] = await Promise.all([
          fetch(`${API_URL}/api/products`),
          fetch(`${API_URL}/api/categories`),
          fetch(`${API_URL}/api/users`)
        ]);

        if (!prodRes.ok || !catRes.ok || !userRes.ok) throw new Error('Error loading data');

        setProducts(await prodRes.json());
        setCategories(await catRes.json());
        setUsers(await userRes.json());
      } catch (err) {
        console.error(err);
        alert('Error loading data from server');
      }
    };
    fetchData();
  }, [API_URL]);

  const handleLogin = (email, username) => {
    const newUser = { email, username, loginTime: new Date().toISOString() };
    setUsers(prev => [...prev, newUser]);
    setUserData(newUser);

    if (email.toLowerCase() === adminEmail && username.toLowerCase() === adminUsername) {
      setIsAdmin(true);
    }
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setIsAdmin(false);
    setUserData(null);
  };

  // ===== Category =====
  const addCategory = async (category) => {
    if (!category.name || !category.description) {
      alert('Fill all fields!');
      return false;
    }
    try {
      const res = await fetch(`${API_URL}/api/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(category)
      });
      if (!res.ok) throw new Error('Error adding category');

      const newCat = await res.json();
      setCategories(prev => [...prev, newCat]);
      alert('Category added!');
      return true;
    } catch (err) {
      console.error(err);
      alert(err.message);
      return false;
    }
  };

  const deleteCategory = async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/categories/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error deleting category');
      setCategories(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  
  const addProduct = async (formData) => {
    try {
      const res = await fetch(`${API_URL}/api/products`, { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Error adding product');
      const newProd = await res.json();
      setProducts(prev => [...prev, newProd]);
      return true;
    } catch (err) {
      console.error(err);
      alert(err.message);
      return false;
    }
  };

  const updateProduct = async (id, formData) => {
    try {
      const res = await fetch(`${API_URL}/api/products/${id}`, { method: 'PUT', body: formData });
      if (!res.ok) throw new Error('Error updating product');
      const updated = await res.json();
      setProducts(prev => prev.map(p => p.id === id ? updated : p));
      return true;
    } catch (err) {
      console.error(err);
      alert(err.message);
      return false;
    }
  };

  const deleteProduct = async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/products/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error deleting product');
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  return (
    <CartProvider>
      <Router>
        <div className="App">
          <Header isLoggedIn={isLoggedIn} isAdmin={isAdmin} onLogout={handleLogout} userData={userData} />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home categories={categories} />} />
              <Route path="/category/:id" element={<Category categories={categories} products={products} />} />
              <Route path="/product/:id" element={<ProductDetail products={products} />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/login" element={
                !isLoggedIn ? <Login onLogin={handleLogin} />
                : isAdmin ? <Navigate to="/admin" /> : <Navigate to="/" />
              } />
              <Route path="/admin" element={
                isAdmin ? <AdminPanel
                  products={products}
                  categories={categories}
                  users={users}
                  onAddProduct={addProduct}
                  onUpdateProduct={updateProduct}
                  onDeleteProduct={deleteProduct}
                  onAddCategory={addCategory}
                  onDeleteCategory={deleteCategory}
                /> : <Navigate to="/login" />
              } />
              <Route path="/about" element={<About />} />
              <Route path="/advertising" element={<Advertising />} />
              <Route path="/privacy" element={<Privacy />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </CartProvider>
  );
}

export default App;