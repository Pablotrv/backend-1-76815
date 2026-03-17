const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Order = require('../models/Order');
const { getConnectedClients } = require('../config/websocket');

// Home
router.get('/', async (req, res) => {
  try {
    const [products, orders] = await Promise.all([
      Product.countDocuments({ active: true }),
      Order.countDocuments(),
    ]);
    res.render('pages/home', {
      title: 'Inicio',
      stats: { products, orders, clients: getConnectedClients() },
    });
  } catch (e) {
    res.render('pages/home', { title: 'Inicio', stats: { products: 0, orders: 0, clients: 0 } });
  }
});

// Shop
router.get('/shop', async (req, res) => {
  try {
    const products = await Product.find({ active: true }).sort({ createdAt: -1 });
    res.render('pages/shop', {
      title: 'Productos',
      products: products.map(p => p.toObject()),
      totalProducts: products.length,
    });
  } catch (e) {
    res.render('pages/shop', { title: 'Productos', products: [], totalProducts: 0 });
  }
});

// Cart
router.get('/cart', (req, res) => {
  res.render('pages/cart', { title: 'Mi Carrito' });
});

// Dashboard
router.get('/dashboard', (req, res) => {
  res.render('pages/dashboard', { title: 'Dashboard Live' });
});

// Realtime Products
router.get('/realtimeproducts', async (req, res) => {
  try {
    const products = await Product.find({ active: true }).sort({ createdAt: -1 });
    res.render('pages/realtimeproducts', {
      title: 'Productos en Tiempo Real',
      products: products.map(p => p.toObject()),
    });
  } catch (e) {
    res.render('pages/realtimeproducts', { title: 'Productos en Tiempo Real', products: [] });
  }
});

module.exports = router;
