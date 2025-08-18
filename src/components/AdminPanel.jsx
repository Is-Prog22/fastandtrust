import React, { useState, useMemo } from 'react';
import '../assets/AdminPanel.css';

const AdminPanel = ({ 
  products, 
  categories, 
  users, 
  onAddProduct, 
  onUpdateProduct, 
  onDeleteProduct, 
  onAddCategory, 
  onDeleteCategory,
  onDeleteUser
}) => {
  const [activeTab, setActiveTab] = useState('products');
  const [editingProduct, setEditingProduct] = useState(null);
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    description: '',
    categoryId: '',
    images: []
  });
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: ''
  });
  const [newProductFiles, setNewProductFiles] = useState([]);
  const [editingProductFiles, setEditingProductFiles] = useState([]);

  // Поиск по товарам
  const [productSearch, setProductSearch] = useState('');

  // Фильтрация товаров по поиску (без учета регистра)
  const filteredProducts = useMemo(() => {
    const lowerSearch = productSearch.toLowerCase();
    return products.filter(p => p.name.toLowerCase().includes(lowerSearch));
  }, [products, productSearch]);

  // Добавление товара с поддержкой до 5 фото
  const handleAddProduct = async (e) => {
    e.preventDefault();

    const category = categories.find(c => c.id === parseInt(newProduct.categoryId));
    if (!category) {
      alert('Пожалуйста, выберите категорию!');
      return;
    }

    if (!newProduct.name || !newProduct.price || !newProduct.description || !newProduct.categoryId) {
      alert('Заполните все поля!');
      return;
    }

    if (newProductFiles.length === 0) {
      if(!window.confirm('Вы точно хотите добавить товар без фотографий?')) return;
    }

    const formData = new FormData();
    formData.append('name', newProduct.name);
    formData.append('price', newProduct.price);
    formData.append('description', newProduct.description);
    formData.append('categoryId', newProduct.categoryId);
    formData.append('categoryName', category.name);
    newProductFiles.forEach(file => formData.append('images', file));

    const success = await onAddProduct(formData);
    if (success) {
      setNewProduct({ name: '', price: '', description: '', categoryId: '', images: [] });
      setNewProductFiles([]);
      alert('Товар успешно добавлен!');
    }
  };

  // Обновление товара
  const handleUpdateProduct = async (e) => {
    e.preventDefault();

    const category = categories.find(c => c.id === parseInt(editingProduct.categoryId));
    if (!category) {
      alert('Пожалуйста, выберите категорию!');
      return;
    }

    if (!editingProduct.name || !editingProduct.price || !editingProduct.description || !editingProduct.categoryId) {
      alert('Заполните все поля!');
      return;
    }

    const formData = new FormData();
    formData.append('name', editingProduct.name);
    formData.append('price', editingProduct.price);
    formData.append('description', editingProduct.description);
    formData.append('categoryId', editingProduct.categoryId);
    formData.append('categoryName', category.name);
    editingProductFiles.forEach(file => formData.append('images', file));

    await onUpdateProduct(editingProduct.id, formData);
    setEditingProduct(null);
    setEditingProductFiles([]);
    alert('Товар успешно обновлен!');
  };

  // Добавляем выбранные файлы к уже существующим, максимум 5
  const handleNewProductFilesChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setNewProductFiles(prevFiles => {
      const combinedFiles = [...prevFiles, ...selectedFiles].slice(0, 5);
      return combinedFiles;
    });
  };

  const handleEditingProductFilesChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setEditingProductFiles(prevFiles => {
      const combinedFiles = [...prevFiles, ...selectedFiles].slice(0, 5);
      return combinedFiles;
    });
  };

  // Добавление категории
  const handleAddCategory = (e) => {
    e.preventDefault();
    if (onAddCategory(newCategory)) {
      setNewCategory({ name: '', description: '' });
      alert('Категория успешно добавлена!');
    }
  };

  return (
    <div className="admin-container">
      <h1>Админ панель</h1>
      
      <div className="admin-tabs">
        <button 
          className={`admin-tab ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => setActiveTab('products')}
        >
          Товары
        </button>
        <button 
          className={`admin-tab ${activeTab === 'categories' ? 'active' : ''}`}
          onClick={() => setActiveTab('categories')}
        >
          Категории
        </button>
        <button 
          className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          Пользователи
        </button>
      </div>

      {/* Управление товарами */}
      <div className={`admin-section ${activeTab === 'products' ? 'active' : ''}`}>
        <h2>Управление товарами</h2>
        
        {/* Поиск товаров */}
        <input
          type="text"
          placeholder="Поиск товаров..."
          className="admin-form-input-search"
          value={productSearch}
          onChange={(e) => setProductSearch(e.target.value)}
          style={{marginBottom: '1rem', padding: '0.75rem 1rem', fontSize: '1rem', borderRadius: '10px', border: '2px solid #e1e5e9'}}
        />

        {/* Добавление товара */}
        <div className="admin-card">
          <h3>Добавить товар</h3>
          <form onSubmit={handleAddProduct} className="admin-form">
            <input
              type="text"
              placeholder="Название товара"
              value={newProduct.name}
              onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
              required
            />
            <input
              type="number"
              step="0.01"
              placeholder="Цена"
              value={newProduct.price}
              onChange={(e) => setNewProduct(prev => ({ ...prev, price: e.target.value }))}
              required
            />
            <select
              value={newProduct.categoryId}
              onChange={(e) => setNewProduct(prev => ({ ...prev, categoryId: e.target.value }))}
              required
            >
              <option value="">Выберите категорию</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
            <textarea
              placeholder="Описание товара"
              value={newProduct.description}
              onChange={(e) => setNewProduct(prev => ({ ...prev, description: e.target.value }))}
              required
            />
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleNewProductFilesChange}
            />
            <small>Можно выбрать до 5 фото</small>
            <button type="submit" className="admin-btn">Добавить товар</button>
          </form>
        </div>

        {/* Список товаров с фильтром */}
        <div className="admin-grid">
          {filteredProducts.length === 0 ? (
            <div className="admin-card"><p>Товары не найдены</p></div>
          ) : (
            filteredProducts.map(product => (
              <div key={product.id} className="admin-card">
                <h4>{product.name}</h4>
                <p>Цена: {product.price} ₽</p>
                <p>Категория: {product.categoryName}</p>
                <p>{product.description.substring(0, 100)}...</p>
                {product.images && product.images.length > 0 && (
                  <div className="product-images">
                    {product.images.map((img, idx) => (
                      <img key={idx} src={`http://localhost:5000${img}`} alt={product.name} width={80} />
                    ))}
                  </div>
                )}
                <div className="admin-actions">
                  <button onClick={() => setEditingProduct(product)} className="admin-btn edit-btn">✏️</button>
                  <button onClick={() => { 
                    if(window.confirm('Удалить этот товар?')) {
                      onDeleteProduct(product.id);
                      alert('Товар удален!');
                    }
                  }} className="admin-btn delete-btn">Удалить</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Управление категориями */}
      <div className={`admin-section ${activeTab === 'categories' ? 'active' : ''}`}>
        <h2>Управление категориями</h2>
        
        <div className="admin-card">
          <h3>Добавить категорию</h3>
          <form onSubmit={handleAddCategory} className="admin-form">
            <input
              type="text"
              placeholder="Название категории"
              value={newCategory.name}
              onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
              required
            />
            <textarea
              placeholder="Описание категории"
              value={newCategory.description}
              onChange={(e) => setNewCategory(prev => ({ ...prev, description: e.target.value }))}
              required
            />
            <button type="submit" className="admin-btn">Добавить категорию</button>
          </form>
        </div>

        <div className="admin-grid">
          {categories.map(category => (
            <div key={category.id} className="admin-card">
              <h4>{category.name}</h4>
              <p>{category.description}</p>
              <button onClick={() => {
                if(window.confirm('Удалить эту категорию?')) {
                  onDeleteCategory(category.id);
                  alert('Категория удалена!');
                }
              }} className="admin-btn delete-btn">Удалить категорию</button>
            </div>
          ))}
        </div>
      </div>

      {/* Пользователи */}
      <div className={`admin-section ${activeTab === 'users' ? 'active' : ''}`}>
        <h2>Зарегистрированные пользователи</h2>
        <div className="admin-grid">
          {users.length === 0 ? (
            <div className="admin-card"><p>Пользователи пока не зарегистрированы</p></div>
          ) : (
            users.map((user, idx) => (
              <div key={user.id || idx} className="admin-card">
                <h4>Пользователь {idx + 1}</h4>
                <p>Имя: {user.name || '-'}</p>
                <p>Email: {user.email}</p>
                <p>Время входа: {new Date(user.loginTime).toLocaleString()}</p>
                <button
                  onClick={() => {
                    if(window.confirm('Удалить этого пользователя?')) {
                      onDeleteUser(user.id);
                      alert('Пользователь удален!');
                    }
                  }}
                  className="admin-btn delete-btn"
                >
                  Удалить пользователя
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Модальное окно редактирования товара */}
      {editingProduct && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Редактировать товар</h3>
            <form onSubmit={handleUpdateProduct} className="admin-form">
              <input
                type="text"
                placeholder="Название товара"
                value={editingProduct.name}
                onChange={(e) => setEditingProduct(prev => ({ ...prev, name: e.target.value }))}
                required
              />
              <input
                type="number"
                step="0.01"
                placeholder="Цена"
                value={editingProduct.price}
                onChange={(e) => setEditingProduct(prev => ({ ...prev, price: e.target.value }))}
                required
              />
              <select
                value={editingProduct.categoryId}
                onChange={(e) => setEditingProduct(prev => ({ ...prev, categoryId: e.target.value }))}
                required
              >
                {categories.map(category => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
              <textarea
                placeholder="Описание товара"
                value={editingProduct.description}
                onChange={(e) => setEditingProduct(prev => ({ ...prev, description: e.target.value }))}
                required
              />
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleEditingProductFilesChange}
              />
              <small>Можно выбрать до 5 фото</small>
              <div className="modal-actions">
                <button type="submit" className="admin-btn">Сохранить</button>
                <button type="button" onClick={() => setEditingProduct(null)} className="admin-btn delete-btn">Отмена</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;