const ApiError = require('../utils/ApiError');

const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse({
    body: req.body,
    params: req.params,
    query: req.query,
  });

  if (!result.success) {
    const details = result.error.issues.map((i) => ({
      field: i.path.slice(1).join('.'),
      issue: i.message,
    }));
    return next(ApiError.badRequest('Validation failed', details));
  }

  req.body = result.data.body ?? req.body;
  req.params = result.data.params ?? req.params;
  req.query = result.data.query ?? req.query;
  next();
};

module.exports = validate;
