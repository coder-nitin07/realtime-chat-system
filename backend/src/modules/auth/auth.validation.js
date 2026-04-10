import Joi from "joi";

// register validation 
export const registerValidation = Joi.object({
    name: Joi.string().min(3).max(20).required(),
    username: Joi.string().min(3).max(15).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).max(40).required()
});

// login validation
export const loginValidation = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(40).required(),
});

export const validateBody = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    next();
  };
};