import jwt from "jsonwebtoken";
import User from "../../models/User.js";

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Not authorized to access this route, token missing",
    });
  }

  try {
    const secret = process.env.JWT_SECRET || "foodygo_secret_jwt_key_2026_super_secure";
    const decoded = jwt.verify(token, secret);

    try {
      if (User) {
        const user = await User.findById(decoded.id).select("-password");
        if (user) {
          req.user = user;
          return next();
        }
      }
    } catch {
    }

    req.user = {
      _id: decoded.id,
      id: decoded.id,
      role: decoded.role || "customer",
      email: decoded.email,
    };
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Token invalid or expired",
      error: error.message,
    });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user ? req.user.role : "unknown"}' is not authorized to access this route. Allowed roles: ${roles.join(", ")}`,
      });
    }
    next();
  };
};
