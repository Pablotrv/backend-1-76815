const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');

// POST /api/orders/checkout
const checkout = async (req, res) => {
  try {
    const { shippingAddress, paymentMethod } = req.body;

    if (!shippingAddress || !paymentMethod) {
      return res.status(400).json({ success: false, message: 'Dirección de envío y método de pago son requeridos.' });
    }

    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'El carrito está vacío.' });
    }

    // Verificar stock y preparar items
    const orderItems = [];
    for (const item of cart.items) {
      const product = await Product.findById(item.product._id);
      if (!product || product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Stock insuficiente para "${item.product.name}". Disponible: ${product?.stock || 0}`,
        });
      }
      orderItems.push({ product: product._id, name: product.name, quantity: item.quantity, price: item.price });
      product.stock -= item.quantity;
      await product.save();
    }

    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      total: cart.total,
      shippingAddress,
      paymentMethod,
    });

    // Vaciar carrito
    cart.items = [];
    cart.total = 0;
    await cart.save();

    res.status(201).json({ success: true, message: 'Orden creada exitosamente.', data: { order } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/orders
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate('items.product', 'name image')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: { orders } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/orders/:id
const getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('items.product', 'name image');
    if (!order) return res.status(404).json({ success: false, message: 'Orden no encontrada.' });
    if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Acceso denegado.' });
    }
    res.json({ success: true, data: { order } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/orders/admin/all  (admin)
const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('user', 'name email')
      .populate('items.product', 'name')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: { orders } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/orders/:id/status  (admin)
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true, runValidators: true });
    if (!order) return res.status(404).json({ success: false, message: 'Orden no encontrada.' });
    res.json({ success: true, message: 'Estado actualizado.', data: { order } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { checkout, getMyOrders, getOrder, getAllOrders, updateOrderStatus };
