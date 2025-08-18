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

  const getAuthHeaders = () => {
    const token = localStorage.getItem('adminToken');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    };
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, catRes, userRes] = await Promise.all([
          fetch(`${API_URL}/api/products`, { 
            headers: getAuthHeaders() 
          }),
          fetch(`${API_URL}/api/categories`, { 
            headers: getAuthHeaders() 
          }),
          fetch(`${API_URL}/api/users`, { 
            headers: getAuthHeaders() 
          })
        ]);

        if (!prodRes.ok || !catRes.ok || !userRes.ok) {
          throw new Error('Error loading data');
        }

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

  const handleLogin = async (email, username) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name: username })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      localStorage.setItem('adminToken', data.token);
      const newUser = { email, username, loginTime: new Date().toISOString() };
      setUsers(prev => [...prev, newUser]);
      setUserData(newUser);

      if (email.toLowerCase() === adminEmail && username.toLowerCase() === adminUsername) {
        setIsAdmin(true);
      }
      setIsLoggedIn(true);
      
      return true;
    } catch (error) {
      console.error('Login error:', error);
      alert(error.message || 'Login failed');
      return false;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setIsLoggedIn(false);
    setIsAdmin(false);
    setUserData(null);
  };

  const addCategory = async (category) => {
    if (!category.name || !category.description) {
      alert('Fill all fields!');
      return false;
    }
    try {
      const res = await fetch(`${API_URL}/api/categories`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(category)
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || 'Error adding category');
      }

      const newCat = await res.json();
      setCategories(prev => [...prev, newCat]);
      return true;
    } catch (err) {
      console.error('Error adding category:', err);
      alert(err.message || 'Failed to add category');
      return false;
    }
  };

  const deleteCategory = async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/categories/${id}`, { 
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || 'Error deleting category');
      }
      setCategories(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      console.error('Error deleting category:', err);
      alert(err.message || 'Failed to delete category');
    }
  };

  const addProduct = async (productData, files) => {
    try {
      const formData = new FormData();
      
      // Add all product data to formData
      Object.keys(productData).forEach(key => {
        if (productData[key] !== undefined) {
          formData.append(key, productData[key]);
        }
      });

      // Add all files to formData
      if (files && files.length > 0) {
        files.forEach(file => {
          formData.append('images', file);
        });
      }

      const res = await fetch(`${API_URL}/api/products`, { 
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: formData
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || 'Error adding product');
      }

      const newProd = await res.json();
      setProducts(prev => [...prev, newProd]);
      return true;
    } catch (err) {
      console.error('Error adding product:', err);
      alert(err.message || 'Failed to add product');
      return false;
    }
  };

  const updateProduct = async (id, productData, files = []) => {
    try {
      const formData = new FormData();
      
      // Add all product data to formData
      Object.keys(productData).forEach(key => {
        if (productData[key] !== undefined) {
          formData.append(key, productData[key]);
        }
      });

      // Add new files to formData
      if (files && files.length > 0) {
        files.forEach(file => {
          formData.append('images', file);
        });
      }

      const res = await fetch(`${API_URL}/api/products/${id}`, { 
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: formData
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || 'Error updating product');
      }

      const updated = await res.json();
      setProducts(prev => prev.map(p => p.id === parseInt(id) ? updated : p));
      return true;
    } catch (err) {
      console.error('Error updating product:', err);
      alert(err.message || 'Failed to update product');
      return false;
    }
  };

  const deleteProduct = async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/products/${id}`, { 
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || 'Error deleting product');
      }
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error('Error deleting product:', err);
      alert(err.message || 'Failed to delete product');
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