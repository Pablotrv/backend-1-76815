const Joi = require("joi");

// Validación para registro de usuario
const registerSchema = Joi.object({
  name: Joi.string().min(2).max(50).required().messages({
    "string.empty": "El nombre es obligatorio",
    "string.min": "El nombre debe tener al menos 2 caracteres",
    "string.max": "El nombre no puede exceder 50 caracteres",
  }),
  email: Joi.string().email().required().messages({
    "string.email": "Debe ser un email válido",
    "any.required": "El email es obligatorio",
  }),
  password: Joi.string().min(6).required().messages({
    "string.min": "La contraseña debe tener al menos 6 caracteres",
    "any.required": "La contraseña es obligatoria",
  }),
});

// Validación para login
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

// Validación para producto
const productSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  description: Joi.string().max(500).optional(),
  price: Joi.number().min(0).required(),
  stock: Joi.number().integer().min(0).required(),
  category: Joi.string().min(1).required(),
  image: Joi.string().uri().optional(),
});

// Middleware para validar
const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    const errors = error.details.map((detail) => detail.message);
    return res
      .status(400)
      .json({ success: false, message: "Errores de validación", errors });
  }
  next();
};

module.exports = { registerSchema, loginSchema, productSchema, validate };
