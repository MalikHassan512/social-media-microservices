import Joi from "joi";

const validateCreatePost = (data) => {
    const schema = Joi.object({
        content: Joi.string().required().min(1).max(1000),
    });
    return schema.validate(data);
};

export { validateCreatePost };