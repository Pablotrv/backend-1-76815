const mongoose = require("mongoose");

/**
 * Middleware para validar que los IDs de los parámetros sean HexStrings de 24 caracteres válidos para MongoDB
 */
const validateId = (req, res, next) => {
  const paramsToValidate = ["id", "cid", "pid"];

  for (const param of paramsToValidate) {
    if (
      req.params[param] &&
      !mongoose.Types.ObjectId.isValid(req.params[param])
    ) {
      return res
        .status(400)
        .json({
          status: "error",
          message: `El formato del ID '${req.params[param]}' no es válido.`,
        });
    }
  }

  next();
};

module.exports = { validateId };
