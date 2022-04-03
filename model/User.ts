const mongoose2 = require("mongoose");

const userShema = new mongoose2.Schema({
  name: {
    type: String,
    required: true,
    min: 6,
    max: 255,
  },
  password: {
    type: String,
    required: true,
    max: 1024,
    min: 6,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  league: {
    type: String,
    required: true,
    max: 1024,
    min: 2,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  admin: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose2.model("User", userShema);
