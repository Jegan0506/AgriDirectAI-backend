const mongoose = require("mongoose");

const produceSchema = new mongoose.Schema(
  {
    crop: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true
    },
    quality: {
      type: String,
      required: true
    },
    harvestDate: {
      type: String,
      required: true
    },
    location: {
      type: String,
      required: true
    },
    expectedPrice: {
      type: Number,
      required: true
    },
    photo: {
      type: String,
      default: ""
    },
    farmerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Farmer",
      default: null
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Produce", produceSchema);
