
const jwt = require("jsonwebtoken");

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Please log in to continue."
    });
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const userId = decoded.id || decoded._id || decoded.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User information is missing. Please log in again."
      });
    }

    req.user = {
      ...decoded,
      id: userId
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Your login session is invalid or expired. Please log in again."
    });
  }
}

module.exports = authMiddleware;
