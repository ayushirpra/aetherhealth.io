import mongoose from 'mongoose'
import bcrypt from 'bcrypt'

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required.'],
      trim: true,
      maxlength: [100, 'Name must be 100 characters or fewer.'],
    },
    email: {
      type: String,
      required: [true, 'Email is required.'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address.'],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required.'],
      select: false, // never returned in queries by default
    },
    role: {
      type: String,
      enum: {
        values: ['patient', 'doctor'],
        message: 'Role must be either "patient" or "doctor".',
      },
      required: [true, 'Role is required.'],
    },
  },
  { timestamps: true },
)

/**
 * comparePassword — compare a plaintext candidate against the stored hash.
 * Must be called on a document retrieved with .select('+passwordHash').
 */
userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.passwordHash)
}

/**
 * toSafeObject — return a plain object safe to send to the client.
 * Removes passwordHash even when it was explicitly selected.
 */
userSchema.methods.toSafeObject = function () {
  const obj = this.toObject()
  delete obj.passwordHash
  return obj
}

const User = mongoose.model('User', userSchema)

export default User
