const ApiError = require("../utils/apiError");

const validate = (schema) => (req, res, next) => {
  const payload = {
    body: req.body ?? {},
    params: req.params ?? {},
    query: req.query ?? {},
  };

  const result = schema.safeParse({
    body: payload.body,
    params: payload.params,
    query: payload.query,
  });

  if (!result.success) {
    const details = result.error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    }));

    return next(new ApiError(400, "Error de validacion", details));
  }

  req.validated = result.data;
  return next();
};

module.exports = validate;
