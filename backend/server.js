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
  const { email, name } = req.body;
  if (email === ADMIN_EMAIL && name === ADMIN_NAME) {
    next();
  } else {
    res.status(403).json({ error: 'Access denied' });
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
  if (email === ADMIN_EMAIL && name === ADMIN_NAME) {
    res.json({ success: true });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Protected routes
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

app.delete('/api/categories/:id', checkAdmin, (req, res) => {
  const db = readDB();
  const id = parseInt(req.params.id);
  db.categories = db.categories.filter(c => c.id !== id);
  writeDB(db);
  res.json({ success: true });
});

app.post('/api/products', checkAdmin, upload.array('images', 5), (req, res) => {
  const db = readDB();
  const { name, price, description, categoryId } = req.body;
  const images = req.files ? req.files.map(f => `/uploads/${f.filename}`) : [];
  
  const newProduct = { 
    id: Date.now(), 
    name, 
    price: parseFloat(price), 
    description, 
    categoryId: parseInt(categoryId), 
    images 
  };
  
  db.products.push(newProduct);
  writeDB(db);
  res.json(newProduct);
});

app.put('/api/products/:id', checkAdmin, upload.array('images', 5), (req, res) => {
  const db = readDB();
  const id = parseInt(req.params.id);
  const index = db.products.findIndex(p => p.id === id);
  
  if (index === -1) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const { name, price, description, categoryId } = req.body;
  const newImages = req.files ? req.files.map(f => `/uploads/${f.filename}`) : [];
  
  db.products[index] = {
    ...db.products[index],
    name,
    price: parseFloat(price),
    description,
    categoryId: parseInt(categoryId),
    images: newImages.length 
      ? [...db.products[index].images, ...newImages].slice(0, 5) 
      : db.products[index].images
  };
  
  writeDB(db);
  res.json(db.products[index]);
});

app.delete('/api/products/:id', checkAdmin, (req, res) => {
  const db = readDB();
  const id = parseInt(req.params.id);
  db.products = db.products.filter(p => p.id !== id);
  writeDB(db);
  res.json({ success: true });
});

// Public routes
app.get('/api/categories', (req, res) => {
  const db = readDB();
  res.json(db.categories);
});

app.get('/api/products', (req, res) => {
  const db = readDB();
  res.json(db.products);
});

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