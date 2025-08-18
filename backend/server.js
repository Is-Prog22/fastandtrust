require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const multer = require('multer');

const app = express();

const PORT = process.env.PORT || 5000;
const DB_FILE = path.join(__dirname, process.env.DB_FILE || 'db.json');
const UPLOADS_DIR = path.join(__dirname, process.env.UPLOADS_DIR || 'uploads');
const FRONTEND_BUILD = path.join(__dirname, '../build');

// Admin credentials from environment
const ADMIN_EMAIL = process.env.REACT_APP_ADMIN_EMAIL;
const ADMIN_NAME = process.env.REACT_APP_ADMIN_NAME;

// Verify admin credentials are set
if (!ADMIN_EMAIL || !ADMIN_NAME) {
  console.error('Error: Admin credentials not configured in .env');
  process.exit(1);
}

// Create uploads directory if it doesn't exist
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(UPLOADS_DIR));
app.use(express.static(FRONTEND_BUILD));

// Admin check middleware
const checkAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ error: 'No authorization token provided' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Invalid token format' });
  }

  try {
    const [email, name] = Buffer.from(token, 'base64').toString().split(':');
    
    if (email === process.env.REACT_APP_ADMIN_EMAIL && name === process.env.REACT_APP_ADMIN_NAME) {
      return next();
    } else {
      return res.status(403).json({ error: 'Invalid admin credentials' });
    }
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Database helpers
function readDB() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ 
      products: [], 
      categories: [], 
      users: [] 
    }, null, 2));
  }
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// Admin login endpoint
app.post('/api/admin/login', (req, res) => {
  const { email, name } = req.body;
  if (email === process.env.REACT_APP_ADMIN_EMAIL && name === process.env.REACT_APP_ADMIN_NAME) {
    const token = Buffer.from(`${email}:${name}`).toString('base64');
    res.json({ 
      success: true, 
      token: token 
    });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Category routes
app.post('/api/categories', checkAdmin, (req, res) => {
  const db = readDB();
  const { name, description } = req.body;
  if (!name || !description) {
    return res.status(400).json({ error: 'Name and description required' });
  }

  const newCategory = { 
    id: Date.now(), 
    name, 
    description 
  };
  db.categories.push(newCategory);
  writeDB(db);
  res.json(newCategory);
});

app.get('/api/categories', (req, res) => {
  const db = readDB();
  res.json(db.categories);
});

app.delete('/api/categories/:id', checkAdmin, (req, res) => {
  const db = readDB();
  const id = parseInt(req.params.id);
  db.categories = db.categories.filter(c => c.id !== id);
  writeDB(db);
  res.json({ success: true });
});

// Product routes
app.post('/api/products', checkAdmin, upload.array('images', 5), (req, res) => {
  const db = readDB();
  const { name, price, description, categoryId, categoryName } = req.body;
  
  if (!name || !price || !description || !categoryId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const newProduct = {
    id: Date.now(),
    name,
    price: parseFloat(price),
    description,
    categoryId: parseInt(categoryId),
    categoryName,
    images: (req.files || []).map(file => `/uploads/${file.filename}`)
  };

  db.products.push(newProduct);
  writeDB(db);
  res.json(newProduct);
});

app.get('/api/products', (req, res) => {
  const db = readDB();
  res.json(db.products);
});

app.put('/api/products/:id', checkAdmin, upload.array('images'), (req, res) => {
  const db = readDB();
  const id = parseInt(req.params.id);
  const { name, price, description, categoryId, categoryName } = req.body;
  
  const productIndex = db.products.findIndex(p => p.id === id);
  if (productIndex === -1) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const existingImages = db.products[productIndex].images || [];
  const newImages = (req.files || []).map(file => `/uploads/${file.filename}`);
  
  db.products[productIndex] = {
    ...db.products[productIndex],
    name: name || db.products[productIndex].name,
    price: price ? parseFloat(price) : db.products[productIndex].price,
    description: description || db.products[productIndex].description,
    categoryId: categoryId ? parseInt(categoryId) : db.products[productIndex].categoryId,
    categoryName: categoryName || db.products[productIndex].categoryName,
    images: [...existingImages, ...newImages].filter(Boolean)
  };

  writeDB(db);
  res.json(db.products[productIndex]);
});

app.delete('/api/products/:id', checkAdmin, (req, res) => {
  const db = readDB();
  const id = parseInt(req.params.id);
  db.products = db.products.filter(p => p.id !== id);
  writeDB(db);
  res.json({ success: true });
});

// Users route
app.get('/api/users', (req, res) => {
  const db = readDB();
  res.json(db.users);
});

// Serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(FRONTEND_BUILD, 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📁 Uploads directory: ${UPLOADS_DIR}`);
  console.log(`💾 Database file: ${DB_FILE}`);
  console.log(`🌍 Frontend build: ${FRONTEND_BUILD}`);
  console.log(`🔒 Admin access: ${ADMIN_EMAIL}`);
});