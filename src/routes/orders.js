const express = require('express');
const router = express.Router();
const { checkout, getMyOrders, getOrder, getAllOrders, updateOrderStatus } = require('../controllers/orderController');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect);

router.post('/checkout', checkout);
router.get('/', getMyOrders);
router.get('/admin/all', adminOnly, getAllOrders);
router.get('/:id', getOrder);
router.put('/:id/status', adminOnly, updateOrderStatus);

module.exports = router;
