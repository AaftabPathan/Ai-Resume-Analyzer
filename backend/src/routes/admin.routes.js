const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/admin.controller');
const { authenticateToken, requireRole } = require('../middlewares/auth.middleware');

router.get('/stats', authenticateToken, requireRole('admin'), AdminController.getSystemStats);
router.get('/users', authenticateToken, requireRole('admin'), AdminController.listUsers);
router.put(
  '/users/:id/role',
  authenticateToken,
  requireRole('admin'),
  AdminController.updateUserRole
);
router.delete('/users/:id', authenticateToken, requireRole('admin'), AdminController.deleteUser);

module.exports = router;
