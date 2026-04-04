const Product = require("../models/Product");
const { emitEvent } = require("../config/websocket");

// GET /api/products
const getProducts = async (req, res) => {
  try {
    let { limit = 10, page = 1, sort, query } = req.query;

    limit = parseInt(limit);
    page = parseInt(page);

    // Filtro dinámico (Categoría o Disponibilidad)
    const filter = {};
    if (query) {
      if (query === "true" || query === "false") {
        filter.active = query === "true";
      } else {
        filter.category = query;
      }
    }

    // Ordenamiento por precio
    const sortOptions = {};
    if (sort === "asc" || sort === "desc") {
      sortOptions.price = sort === "asc" ? 1 : -1;
    }

    const skip = (page - 1) * limit;
    const totalDocs = await Product.countDocuments(filter);
    const totalPages = Math.ceil(totalDocs / limit);

    const products = await Product.find(filter)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    const hasPrevPage = page > 1;
    const hasNextPage = page < totalPages;

    // Construcción de enlaces de navegación
    const baseUrl = `${req.protocol}://${req.get("host")}${req.baseUrl}`;
    const buildLink = (p) =>
      p
        ? `${baseUrl}?page=${p}&limit=${limit}${sort ? `&sort=${sort}` : ""}${query ? `&query=${query}` : ""}`
        : null;

    res.json({
      status: "success",
      payload: products,
      totalPages,
      prevPage: hasPrevPage ? page - 1 : null,
      nextPage: hasNextPage ? page + 1 : null,
      page,
      hasPrevPage,
      hasNextPage,
      prevLink: buildLink(hasPrevPage ? page - 1 : null),
      nextLink: buildLink(hasNextPage ? page + 1 : null),
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

// GET /api/products/:id
const getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product || !product.active) {
      return res
        .status(404)
        .json({ success: false, message: "Producto no encontrado." });
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
    emitEvent("product:created", {
      _id: product._id,
      name: product.name,
      price: product.price,
      stock: product.stock,
      category: product.category,
    });
    res
      .status(201)
      .json({ success: true, message: "Producto creado.", data: { product } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/products/:id  (admin)
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!product)
      return res
        .status(404)
        .json({ success: false, message: "Producto no encontrado." });
    emitEvent("product:updated", {
      _id: product._id,
      name: product.name,
      price: product.price,
      stock: product.stock,
      category: product.category,
    });
    res.json({
      success: true,
      message: "Producto actualizado.",
      data: { product },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/products/:id  (admin)
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { active: false },
      { new: true },
    );
    if (!product)
      return res
        .status(404)
        .json({ success: false, message: "Producto no encontrado." });
    emitEvent("product:deleted", { _id: product._id, name: product.name });
    res.json({ success: true, message: "Producto eliminado." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
};
