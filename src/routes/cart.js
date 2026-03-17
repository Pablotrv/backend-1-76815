const express = require('express');
const router = express.Router();
const { getCart, addItem, updateItem, removeItem, clearCart } = require('../controllers/cartController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getCart);
router.post('/add', addItem);
router.put('/update/:productId', updateItem);
router.delete('/remove/:productId', removeItem);
router.delete('/clear', clearCart);

module.exports = router;
