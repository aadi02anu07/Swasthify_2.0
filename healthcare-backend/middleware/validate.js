const { validationResult } = require("express-validator");

/**
 * validate
 * Drop this after any express-validator chain.
 * If there are errors it sends a 400 immediately; otherwise calls next().
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: "Validation failed",
      details: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

module.exports = validate;