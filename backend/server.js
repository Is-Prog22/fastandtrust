require('dotenv').config();
const express = require('express');
const fs = require('fs').promises;
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

// Ensure uploads directory exists
const ensureUploadsDir = async () => {
  try {
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating uploads directory:', error);
    process.exit(1);
  }
};

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(UPLOADS_DIR));
app.use(express.static(FRONTEND_BUILD));

// Database helpers with error handling
async function readDB() {
  try {
    const data = await fs.readFile(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      // If file doesn't exist, create with default data
      const defaultData = { 
        products: [], 
        categories: [], 
        users: [] 
      };
      await writeDB(defaultData);
      return defaultData;
    }
    console.error('Error reading database:', error);
    throw error;
  }
}

async function writeDB(data) {
  try {
    await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error('Error writing to database:', error);
    throw error;
  }
}

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
    
    if (email === ADMIN_EMAIL && name === ADMIN_NAME) {
      return next();
    } else {
      return res.status(403).json({ error: 'Invalid admin credentials' });
    }
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Initialize database on startup
async function initializeDatabase() {
  try {
    await ensureUploadsDir();
    await readDB(); // This will create the database file if it doesn't exist
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }
}

// Routes remain the same, but with async/await
app.post('/api/admin/login', async (req, res) => {
  const { email, name } = req.body;
  if (email === ADMIN_EMAIL && name === ADMIN_NAME) {
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
app.post('/api/categories', checkAdmin, async (req, res) => {
  try {
    const db = await readDB();
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
    await writeDB(db);
    res.json(newCategory);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/categories', async (req, res) => {
  try {
    const db = await readDB();
    res.json(db.categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/categories/:id', checkAdmin, async (req, res) => {
  try {
    const db = await readDB();
    const id = parseInt(req.params.id);
    db.categories = db.categories.filter(c => c.id !== id);
    await writeDB(db);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Product routes
app.post('/api/products', checkAdmin, upload.array('images', 5), async (req, res) => {
  try {
    const db = await readDB();
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
    await writeDB(db);
    res.json(newProduct);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/products', async (req, res) => {
  try {
    const db = await readDB();
    res.json(db.products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/products/:id', checkAdmin, upload.array('images'), async (req, res) => {
  try {
    const db = await readDB();
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

    await writeDB(db);
    res.json(db.products[productIndex]);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/products/:id', checkAdmin, async (req, res) => {
  try {
    const db = await readDB();
    const id = parseInt(req.params.id);
    db.products = db.products.filter(p => p.id !== id);
    await writeDB(db);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Users route
app.get('/api/users', async (req, res) => {
  try {
    const db = await readDB();
    res.json(db.users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
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
async function startServer() {
  await initializeDatabase();
  
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

startServer().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});