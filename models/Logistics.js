const mongoose = require("mongoose");

const logisticsSchema = new mongoose.Schema(
  {
    produceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Produce",
      default: null
    },
    bidId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bid",
      default: null
    },
    farmerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Farmer",
      default: null
    },
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Buyer",
      default: null
    },
    farmerName: {
      type: String,
      default: "Farmer"
    },
    buyerName: {
      type: String,
      default: "Buyer"
    },
    crop: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true
    },
    pickupLocation: {
      type: String,
      required: true
    },
    destination: {
      type: String,
      required: true
    },
    preferredPickupDate: {
      type: String,
      default: ""
    },
    deliveryPriority: {
      type: String,
      enum: ["Normal", "Express", "Urgent"],
      default: "Normal"
    },
    vehicleType: {
      type: String,
      enum: ["Mini Truck", "Light Commercial Vehicle", "Truck", "Refrigerated Truck"],
      default: "Mini Truck"
    },
    suggestedVehicle: {
      type: String,
      default: "Mini Truck"
    },
    transporterId: {
      type: String,
      default: null
    },
    transporterName: {
      type: String,
      default: ""
    },
    transporterPhone: {
      type: String,
      default: ""
    },
    estimatedDistance: {
      type: Number,
      default: 0
    },
    estimatedTime: {
      type: String,
      default: ""
    },
    transportCost: {
      type: Number,
      default: 0
    },
    fuelCost: {
      type: Number,
      default: 0
    },
    tollCost: {
      type: Number,
      default: 0
    },
    handlingCost: {
      type: Number,
      default: 0
    },
    selectedRoute: {
      type: Object,
      default: null
    },
    routeScore: {
      type: Number,
      default: 0
    },
    availableRoutes: {
      type: Array,
      default: []
    },
    matchedTransporters: {
      type: Array,
      default: []
    },
    status: {
      type: String,
      enum: [
        "Transport Required",
        "Finding Transport",
        "Transport Matched",
        "Pending Transporter Approval",
        "Accepted",
        "Rejected",
        "Pickup Scheduled",
        "Picked Up",
        "In Transit",
        "Delivered"
      ],
      default: "Transport Required"
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Logistics", logisticsSchema);
