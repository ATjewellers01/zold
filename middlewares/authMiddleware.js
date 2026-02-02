const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

// Authentication middleware
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }
  
  try {
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = { 
      id: decoded.userId, 
      role: decoded.role, 
      adminRole: decoded.adminRole,
      username: decoded.username 
    };
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

// Role-based access control middleware
const roleMiddleware = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    next();
  };
};

// Permission-based middleware for granular admin access control
const hasPermission = (requiredPermissions) => {
  return (req, res, next) => {
    const { role, adminRole } = req.user;
    
    // Super admin has all permissions
    if (role === 'ADMIN' && adminRole === 'SUPER_ADMIN') {
      return next();
    }
    
    // For non-super admins, check specific permissions
    if (role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    
    const permissions = getPermissionsByRole(adminRole);
    const hasAccess = requiredPermissions.some(p => permissions.includes(p));
    
    if (!hasAccess) {
      return res.status(403).json({ 
        success: false, 
        message: 'Insufficient permissions for this operation' 
      });
    }
    
    next();
  };
};

// Get permissions based on admin role type
const getPermissionsByRole = (adminRole) => {
  const permissionMap = {
    OPERATIONS_ADMIN: [
      'manage_orders',
      'manage_delivery', 
      'manage_conversions',
      'view_partners',
      'assign_partners'
    ],
    FINANCE_ADMIN: [
      'view_transactions', 
      'manage_settlements', 
      'view_reports',
      'export_data',
      'manage_rates'
    ],
    LOAN_ADMIN: [
      'approve_loans', 
      'manage_pledges', 
      'manage_emi',
      'view_loans',
      'process_repayment'
    ],
    SUPPORT_ADMIN: [
      'view_tickets', 
      'respond_tickets', 
      'view_users',
      'verify_kyc',
      'manage_complaints'
    ],
  };
  
  return permissionMap[adminRole] || [];
};

module.exports = {
  authMiddleware,
  roleMiddleware,
  hasPermission
};
