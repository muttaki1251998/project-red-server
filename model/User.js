const mongoose = require("mongoose");
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    fullname: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, required: true },
    occupation: { type: String, required: true },
    profilePicture: { type: String, required: true },
    profileIdPicture: {type: String, required: true},
    facebookLink: { type: String, required: false },
    linkedInLink: { type: String, required: false },
    address: { type: String, required: true },
    city: { type: String, required: true },
    country: { type: String, required: true },
    degree: {type: String, required: true},
    university: {type: String, required: true},
    isVerified: {type: Boolean, default: false}
  },
  {
    timestamps: true,
  }
);

userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 8);
  }
  next();
});

const User = mongoose.model("User", userSchema);

module.exports = User;
