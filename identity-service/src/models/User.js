import moongoose from 'mongoose';
import argon2 from 'argon2';

const userSchema = new moongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: true,
        trim: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },

},
    {
        timestamps: true,
    }
);


userSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
        try {
            this.password = await argon2.hash(this.password);
        }
        catch (error) {
            return next(error);
        }
    }
    next();
}
);
userSchema.methods.comparePassword = async function (password) {
    try {
        return await argon2.verify(this.password, password);
    }
    catch (error) {
        throw new Error('Password comparison failed');
    }
}


userSchema.index({ username: 'text' });

const User = moongoose.model('User', userSchema);
export default User;