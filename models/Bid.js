const mongoose = require("mongoose");

const bidSchema = new mongoose.Schema(
  {
    produceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Produce",
      required: true
    },

    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Buyer",
      required: true
    },

    buyerName: {
      type: String,
      required: true
    },

    crop: {
      type: String,
      required: true
    },

    quantity: {
      type: Number,
      required: true
    },

    bidPrice: {
      type: Number,
      required: true
    },

    status: {
      type: String,
      enum: ["Pending", "Accepted", "Rejected"],
      default: "Pending"
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Bid", bidSchema);
