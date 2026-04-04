const Cart = require("../models/Cart");
const Product = require("../models/Product");
const { emitEvent } = require("../config/websocket");

// GET /api/carts/:cid - Obtener carrito específico con populate
const getCartById = async (req, res) => {
  try {
    const { cid } = req.params;
    const cart = await Cart.findById(cid).populate("items.product");

    if (!cart) {
      return res
        .status(404)
        .json({ success: false, message: "Carrito no encontrado" });
    }

    res.json({ success: true, data: { cart } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/cart (Mantiene compatibilidad con el usuario actual)
const getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id }).populate(
      "items.product",
      "name price image stock",
    );
    if (!cart) {
      return res.json({
        success: true,
        data: { cart: { items: [], total: 0 } },
      });
    }
    res.json({ success: true, data: { cart } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/cart/add
const addItem = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;

    if (!productId)
      return res
        .status(400)
        .json({ success: false, message: "productId es requerido." });

    const product = await Product.findById(productId);
    if (!product || !product.active) {
      return res
        .status(404)
        .json({ success: false, message: "Producto no encontrado." });
    }
    if (product.stock < quantity) {
      return res
        .status(400)
        .json({
          success: false,
          message: `Stock insuficiente. Disponible: ${product.stock}`,
        });
    }

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    const existingItem = cart.items.find(
      (item) => item.product.toString() === productId,
    );

    if (existingItem) {
      const newQty = existingItem.quantity + quantity;
      if (product.stock < newQty) {
        return res
          .status(400)
          .json({
            success: false,
            message: `Stock insuficiente. Disponible: ${product.stock}`,
          });
      }
      existingItem.quantity = newQty;
      existingItem.price = product.price;
    } else {
      cart.items.push({ product: productId, quantity, price: product.price });
    }

    cart.calculateTotal();
    await cart.save();
    await cart.populate("items.product", "name price image stock");

    emitEvent("cart:updated", {
      userId: req.user._id,
      action: "item_added",
      productName: product.name,
      total: cart.total,
      itemCount: cart.items.length,
    });

    res.json({
      success: true,
      message: "Producto agregado al carrito.",
      data: { cart },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/carts/:cid/products/:pid - Actualizar SÓLO la cantidad
const updateProductQuantity = async (req, res) => {
  try {
    const { quantity } = req.body;
    const { cid, pid } = req.params;

    if (quantity === undefined || quantity < 1) {
      return res
        .status(400)
        .json({ success: false, message: "Cantidad debe ser al menos 1." });
    }

    const product = await Product.findById(pid);
    if (!product)
      return res
        .status(404)
        .json({ success: false, message: "Producto no encontrado." });

    if (product.stock < quantity) {
      return res
        .status(400)
        .json({
          success: false,
          message: `Stock insuficiente. Disponible: ${product.stock}`,
        });
    }

    const cart = await Cart.findById(cid);
    if (!cart)
      return res
        .status(404)
        .json({ success: false, message: "Carrito no encontrado." });

    const item = cart.items.find((i) => i.product.toString() === pid);
    if (!item)
      return res
        .status(404)
        .json({ success: false, message: "Producto no está en el carrito." });

    item.quantity = quantity;
    item.price = product.price;

    if (typeof cart.calculateTotal === "function") {
      cart.calculateTotal();
    } else {
      cart.total = cart.items.reduce((acc, i) => acc + i.price * i.quantity, 0);
    }

    await cart.save();

    res.json({
      success: true,
      message: "Carrito actualizado.",
      data: { cart },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/carts/:cid/products/:pid - Eliminar producto del carrito
const deleteProductFromCart = async (req, res) => {
  try {
    const { cid, pid } = req.params;
    const cart = await Cart.findById(cid);
    if (!cart)
      return res
        .status(404)
        .json({ success: false, message: "Carrito no encontrado." });

    cart.items = cart.items.filter((i) => i.product.toString() !== pid);

    if (typeof cart.calculateTotal === "function") {
      cart.calculateTotal();
    } else {
      cart.total = cart.items.reduce((acc, i) => acc + i.price * i.quantity, 0);
    }

    await cart.save();

    res.json({
      success: true,
      message: "Producto eliminado del carrito.",
      data: { cart },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/cart/remove/:productId (Mantiene compatibilidad con ruta antigua)
const removeItem = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart)
      return res
        .status(404)
        .json({ success: false, message: "Carrito no encontrado." });

    cart.items = cart.items.filter(
      (i) => i.product.toString() !== req.params.productId,
    );
    if (typeof cart.calculateTotal === "function") cart.calculateTotal();
    await cart.save();

    res.json({
      success: true,
      message: "Producto eliminado del carrito.",
      data: { cart },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/cart/clear
const clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart)
      return res
        .status(404)
        .json({ success: false, message: "Carrito no encontrado." });

    cart.items = [];
    cart.total = 0;
    await cart.save();

    res.json({ success: true, message: "Carrito vaciado.", data: { cart } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/carts/:cid - Vaciar carrito por ID
const clearCartById = async (req, res) => {
  try {
    const { cid } = req.params;
    const cart = await Cart.findById(cid);
    if (!cart)
      return res
        .status(404)
        .json({ success: false, message: "Carrito no encontrado." });

    cart.items = [];
    cart.total = 0;
    await cart.save();

    res.json({ success: true, message: "Carrito vaciado.", data: { cart } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/carts/:cid - Actualizar con arreglo de productos
const updateCart = async (req, res) => {
  try {
    const { cid } = req.params;
    const { products } = req.body;

    const cart = await Cart.findById(cid);
    if (!cart)
      return res
        .status(404)
        .json({ success: false, message: "Carrito no encontrado." });

    cart.items = products;
    if (typeof cart.calculateTotal === "function") {
      cart.calculateTotal();
    } else {
      cart.total = cart.items.reduce((acc, i) => acc + i.price * i.quantity, 0);
    }
    await cart.save();

    res.json({
      success: true,
      message: "Carrito actualizado completamente.",
      data: { cart },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getCart,
  addItem,
  updateItem: updateProductQuantity,
  removeItem,
  clearCart,
  getCartById,
  deleteProductFromCart,
  updateCart,
  updateProductQuantity,
  clearCartById,
};
