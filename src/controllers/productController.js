const Product = require('../models/Product');
const { emitEvent } = require('../config/websocket');

// GET /api/products
const getProducts = async (req, res) => {
  try {
    const { category, search, minPrice, maxPrice, page = 1, limit = 10 } = req.query;
    const filter = { active: true };

    if (category) filter.category = category;
    if (search) filter.name = { $regex: search, $options: 'i' };
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Product.countDocuments(filter);
    const products = await Product.find(filter).skip(skip).limit(Number(limit)).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { products, total, page: Number(page), totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/products/:id
const getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product || !product.active) {
      return res.status(404).json({ success: false, message: 'Producto no encontrado.' });
    }
    res.json({ success: true, data: { product } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/products  (admin)
const createProduct = async (req, res) => {
  try {
    const product = await Product.create(req.body);
    emitEvent('product:created', {
      _id: product._id, name: product.name, price: product.price,
      stock: product.stock, category: product.category,
    });
    res.status(201).json({ success: true, message: 'Producto creado.', data: { product } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/products/:id  (admin)
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ success: false, message: 'Producto no encontrado.' });
    emitEvent('product:updated', {
      _id: product._id, name: product.name, price: product.price,
      stock: product.stock, category: product.category,
    });
    res.json({ success: true, message: 'Producto actualizado.', data: { product } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/products/:id  (admin)
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, { active: false }, { new: true });
    if (!product) return res.status(404).json({ success: false, message: 'Producto no encontrado.' });
    emitEvent('product:deleted', { _id: product._id, name: product.name });
    res.json({ success: true, message: 'Producto eliminado.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getProducts, getProduct, createProduct, updateProduct, deleteProduct };
