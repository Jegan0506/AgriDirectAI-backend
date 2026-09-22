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
    originalBidPrice: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ["Pending", "Accepted", "Rejected", "Counter Offer"],
      default: "Pending"
    },
    counterOfferPrice: {
      type: Number,
      default: null
    },
    counterOfferBy: {
      type: String,
      enum: ["Farmer", "Buyer", null],
      default: null
    },
    negotiationMessage: {
      type: String,
      default: ""
    },
    negotiationHistory: [
      {
        by: {
          type: String,
          enum: ["Buyer", "Farmer"]
        },
        price: {
          type: Number
        },
        message: {
          type: String,
          default: ""
        },
        status: {
          type: String
        },
        createdAt: {
          type: Date,
          default: Date.now
        }
      }
    ],
    isPaid: {
      type: Boolean,
      default: false
    },
    paymentStatus: {
      type: String,
      default: "Pending"
    },
    transactionId: {
      type: String,
      default: ""
    },
    paymentMethod: {
      type: String,
      default: ""
    },
    paymentDate: {
      type: String,
      default: ""
    },
    isDemoPayment: {
      type: Boolean,
      default: true
    },
    produceAmount: {
      type: Number,
      default: 0
    },
    transportFreight: {
      type: Number,
      default: 6500
    },
    totalAmount: {
      type: Number,
      default: 0
    },
    farmerSettlementStatus: {
      type: String,
      default: "Pending"
    },
    transporterSettlementStatus: {
      type: String,
      default: "Pending"
    },
    maskedAccount: {
      type: String,
      default: ""
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Bid", bidSchema);
