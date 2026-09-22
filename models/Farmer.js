const mongoose = require("mongoose");

const farmerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      default: ""
    },
    location: {
      type: String,
      default: ""
    },
    farmName: {
      type: String,
      default: "My Farm"
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Farmer", farmerSchema);
