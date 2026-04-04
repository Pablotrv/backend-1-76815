const express = require("express");
const router = express.Router();
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");
const { protect, adminOnly } = require("../middleware/auth");
const { validate, productSchema } = require("../middleware/validation");

router.get("/", getProducts);
router.get("/:id", getProduct);
router.post("/", protect, adminOnly, validate(productSchema), createProduct);
router.put("/:id", protect, adminOnly, validate(productSchema), updateProduct);
router.delete("/:id", protect, adminOnly, deleteProduct);

module.exports = router;
