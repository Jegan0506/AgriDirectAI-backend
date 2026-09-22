const mongoose = require("mongoose");

const transporterSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true,
      unique: true
    },
    password: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    companyName: {
      type: String,
      default: "Express Transport Co."
    },
    vehicleType: {
      type: String,
      default: "Mini Truck"
    },
    operatingLocation: {
      type: String,
      default: "Tamil Nadu"
    },
    bankAccount: {
      type: String,
      default: ""
    },
    ifsc: {
      type: String,
      default: ""
    },
    upiId: {
      type: String,
      default: ""
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Transporter", transporterSchema);
