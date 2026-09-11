const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const { GoogleGenAI } = require("@google/genai");
require("dotenv").config();

const app = express();

/* =========================================================
   CORS
========================================================= */

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "https://agridirectai-frontend.vercel.app"
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
    credentials: true
  })
);

/* =========================================================
   JSON
========================================================= */

app.use(
  express.json({
    limit: "10mb"
  })
);

/* =========================================================
   GEMINI AI
========================================================= */

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

/* =========================================================
   PRODUCE SCHEMA
========================================================= */

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

const Produce = mongoose.model(
  "Produce",
  produceSchema
);

/* =========================================================
   BUYER SCHEMA
========================================================= */

const buyerSchema = new mongoose.Schema(
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

    businessName: {
      type: String,
      required: true
    },

    phone: {
      type: String,
      required: true
    },

    location: {
      type: String,
      required: true
    },

    buyerType: {
      type: String,
      required: true
    },

    interestedCrops: {
      type: [String],
      default: []
    }
  },
  {
    timestamps: true
  }
);

const Buyer = mongoose.model(
  "Buyer",
  buyerSchema
);

/* =========================================================
   FARMER SCHEMA
========================================================= */

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

const Farmer = mongoose.model(
  "Farmer",
  farmerSchema
);

/* =========================================================
   BID SCHEMA
========================================================= */

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
      enum: [
        "Pending",
        "Accepted",
        "Rejected",
        "Counter Offer"
      ],
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
    ]
  },
  {
    timestamps: true
  }
);

const Bid = mongoose.model(
  "Bid",
  bidSchema
);

/* =========================================================
   AUTH
========================================================= */

/* =========================================================
   REGISTER
========================================================= */

app.post(
  "/api/auth/register",
  async (req, res) => {
    try {
      const {
        name,
        email,
        phone,
        password,
        role
      } = req.body;

      if (
        !name ||
        !email ||
        !phone ||
        !password ||
        !role
      ) {
        return res.status(400).json({
          success: false,
          message:
            "All details are required"
        });
      }

      if (
        role !== "farmer" &&
        role !== "buyer"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid role"
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message:
            "Password must contain at least 6 characters"
        });
      }

      const cleanEmail =
        email.trim().toLowerCase();

      const existingFarmer =
        await Farmer.findOne({
          email: cleanEmail
        });

      const existingBuyer =
        await Buyer.findOne({
          email: cleanEmail
        });

      if (
        existingFarmer ||
        existingBuyer
      ) {
        return res.status(409).json({
          success: false,
          message:
            "An account with this email already exists"
        });
      }

      const hashedPassword =
        await bcrypt.hash(
          password,
          10
        );

      let user;

      /* ================================
         FARMER REGISTER
      ================================= */

      if (role === "farmer") {
        user = new Farmer({
          name,
          email: cleanEmail,
          password: hashedPassword,
          phone,
          location: "",
          farmName: "My Farm"
        });

        user =
          await user.save();
      }

      /* ================================
         BUYER REGISTER
      ================================= */

      if (role === "buyer") {
        user = new Buyer({
          name,
          email: cleanEmail,
          password: hashedPassword,
          businessName: "My Business",
          phone,
          location: "Not provided",
          buyerType: "Retailer",
          interestedCrops: []
        });

        user =
          await user.save();
      }

      const userObject =
        user.toObject();

      delete userObject.password;

      console.log(
        `🆕 ${role} registered:`,
        cleanEmail
      );

      res.status(201).json({
        success: true,
        message:
          "Account created successfully",
        role,
        user: userObject
      });

    } catch (error) {
      console.log(
        "Registration error:",
        error.message
      );

      res.status(500).json({
        success: false,
        message:
          "Registration failed"
      });
    }
  }
);

/* =========================================================
   LOGIN
========================================================= */

app.post(
  "/api/login",
  async (req, res) => {
    try {
      const {
        email,
        password,
        role
      } = req.body;

      if (
        !email ||
        !password ||
        !role
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Email, password and role are required"
        });
      }

      const cleanEmail =
        email.trim().toLowerCase();

      let user = null;

      if (role === "farmer") {
        user =
          await Farmer.findOne({
            email: cleanEmail
          });
      }

      if (role === "buyer") {
        user =
          await Buyer.findOne({
            email: cleanEmail
          });
      }

      if (!user) {
        return res.status(401).json({
          success: false,
          message:
            "Account not found"
        });
      }

      const passwordMatch =
        await bcrypt.compare(
          password,
          user.password
        );

      if (!passwordMatch) {
        return res.status(401).json({
          success: false,
          message:
            "Incorrect password"
        });
      }

      const userObject =
        user.toObject();

      delete userObject.password;

      console.log(
        `🔐 ${role} logged in:`,
        user.email
      );

      res.json({
        success: true,
        message:
          "Login successful",
        role,
        user: userObject
      });

    } catch (error) {
      console.log(
        "Login error:",
        error.message
      );

      res.status(500).json({
        success: false,
        message:
          "Login failed"
      });
    }
  }
);

/* =========================================================
   PRODUCE
========================================================= */

/* =========================================================
   GET PRODUCE
========================================================= */

app.get(
  "/api/produce",
  async (req, res) => {
    try {
      const produceList =
        await Produce.find()
          .sort({
            createdAt: -1
          });

      res.json(
        produceList
      );

    } catch (error) {
      console.log(
        "Fetch produce error:",
        error.message
      );

      res.status(500).json({
        message:
          "Failed to fetch produce"
      });
    }
  }
);

/* =========================================================
   ADD PRODUCE
========================================================= */

app.post(
  "/api/produce",
  async (req, res) => {
    try {
      const {
        crop,
        quantity,
        quality,
        harvestDate,
        location,
        expectedPrice,
        photo,
        farmerId
      } = req.body;

      if (
        !crop ||
        !quantity ||
        !quality ||
        !harvestDate ||
        !location ||
        !expectedPrice
      ) {
        return res.status(400).json({
          message:
            "All crop details are required"
        });
      }

      const newProduce =
        new Produce({
          crop,
          quantity,
          quality,
          harvestDate,
          location,
          expectedPrice,
          photo: photo || "",
          farmerId:
            farmerId || null
        });

      const savedProduce =
        await newProduce.save();

      console.log(
        "🌾 Produce added:",
        savedProduce.crop
      );

      res.status(201).json({
        message:
          "Produce added successfully",
        produce:
          savedProduce
      });

    } catch (error) {
      console.log(
        "Add produce error:",
        error.message
      );

      res.status(500).json({
        message:
          "Failed to add produce"
      });
    }
  }
);

/* =========================================================
   UPDATE PRODUCE
========================================================= */

app.put(
  "/api/produce/:id",
  async (req, res) => {
    try {
      const updatedProduce =
        await Produce.findByIdAndUpdate(
          req.params.id,
          req.body,
          {
            new: true,
            runValidators: true
          }
        );

      if (!updatedProduce) {
        return res.status(404).json({
          message:
            "Produce not found"
        });
      }

      res.json({
        message:
          "Produce updated successfully",
        produce:
          updatedProduce
      });

    } catch (error) {
      console.log(
        "Update produce error:",
        error.message
      );

      res.status(500).json({
        message:
          "Failed to update produce"
      });
    }
  }
);

/* =========================================================
   DELETE PRODUCE
========================================================= */

app.delete(
  "/api/produce/:id",
  async (req, res) => {
    try {
      const deletedProduce =
        await Produce.findByIdAndDelete(
          req.params.id
        );

      if (!deletedProduce) {
        return res.status(404).json({
          message:
            "Produce not found"
        });
      }

      res.json({
        message:
          "Produce deleted successfully"
      });

    } catch (error) {
      console.log(
        "Delete produce error:",
        error.message
      );

      res.status(500).json({
        message:
          "Failed to delete produce"
      });
    }
  }
);

/* =========================================================
   BUYER
========================================================= */

/* =========================================================
   CREATE BUYER
========================================================= */

app.post(
  "/api/buyers",
  async (req, res) => {
    try {
      const {
        name,
        email,
        password,
        businessName,
        phone,
        location,
        buyerType,
        interestedCrops
      } = req.body;

      if (
        !name ||
        !email ||
        !password ||
        !businessName ||
        !phone ||
        !location ||
        !buyerType
      ) {
        return res.status(400).json({
          message:
            "All buyer details are required"
        });
      }

      const cleanEmail =
        email.trim().toLowerCase();

      const existingBuyer =
        await Buyer.findOne({
          email: cleanEmail
        });

      if (existingBuyer) {
        return res.status(409).json({
          message:
            "An account with this email already exists"
        });
      }

      const hashedPassword =
        await bcrypt.hash(
          password,
          10
        );

      const newBuyer =
        new Buyer({
          name,
          email: cleanEmail,
          password: hashedPassword,
          businessName,
          phone,
          location,
          buyerType,
          interestedCrops:
            interestedCrops || []
        });

      const savedBuyer =
        await newBuyer.save();

      const buyerObject =
        savedBuyer.toObject();

      delete buyerObject.password;

      console.log(
        "👨‍💼 Buyer added:",
        savedBuyer.businessName
      );

      res.status(201).json({
        message:
          "Buyer registered successfully",
        buyer:
          buyerObject
      });

    } catch (error) {
      console.log(
        "Create buyer error:",
        error.message
      );

      res.status(500).json({
        message:
          "Failed to register buyer"
      });
    }
  }
);

/* =========================================================
   GET BUYERS
========================================================= */

app.get(
  "/api/buyers",
  async (req, res) => {
    try {
      const buyers =
        await Buyer.find()
          .select("-password")
          .sort({
            createdAt: -1
          });

      res.json(
        buyers
      );

    } catch (error) {
      console.log(
        "Fetch buyers error:",
        error.message
      );

      res.status(500).json({
        message:
          "Failed to fetch buyers"
      });
    }
  }
);

/* =========================================================
   GET SINGLE BUYER
========================================================= */

app.get(
  "/api/buyers/:id",
  async (req, res) => {
    try {
      const buyer =
        await Buyer.findById(
          req.params.id
        ).select("-password");

      if (!buyer) {
        return res.status(404).json({
          message:
            "Buyer not found"
        });
      }

      res.json(
        buyer
      );

    } catch (error) {
      console.log(
        "Get buyer error:",
        error.message
      );

      res.status(500).json({
        message:
          "Failed to fetch buyer"
      });
    }
  }
);

/* =========================================================
   UPDATE BUYER PROFILE
========================================================= */

app.put(
  "/api/buyers/:id",
  async (req, res) => {
    try {
      const {
        name,
        email,
        businessName,
        phone,
        location,
        buyerType,
        interestedCrops
      } = req.body;

      const updatedBuyer =
        await Buyer.findByIdAndUpdate(
          req.params.id,
          {
            name,
            email: email
              ? email
                  .trim()
                  .toLowerCase()
              : undefined,
            businessName,
            phone,
            location,
            buyerType,
            interestedCrops
          },
          {
            new: true,
            runValidators: true
          }
        ).select("-password");

      if (!updatedBuyer) {
        return res.status(404).json({
          message:
            "Buyer not found"
        });
      }

      res.json({
        message:
          "Profile updated successfully",
        buyer:
          updatedBuyer
      });

    } catch (error) {
      console.log(
        "Update buyer error:",
        error.message
      );

      res.status(500).json({
        message:
          "Failed to update buyer profile"
      });
    }
  }
);

/* =========================================================
   FARMER
========================================================= */

/* =========================================================
   CREATE FARMER
========================================================= */

app.post(
  "/api/farmers",
  async (req, res) => {
    try {
      const {
        name,
        email,
        password,
        phone,
        location,
        farmName
      } = req.body;

      if (
        !name ||
        !email ||
        !password
      ) {
        return res.status(400).json({
          message:
            "Name, email and password are required"
        });
      }

      const cleanEmail =
        email.trim().toLowerCase();

      const existingFarmer =
        await Farmer.findOne({
          email: cleanEmail
        });

      if (existingFarmer) {
        return res.status(409).json({
          message:
            "An account with this email already exists"
        });
      }

      const hashedPassword =
        await bcrypt.hash(
          password,
          10
        );

      const newFarmer =
        new Farmer({
          name,
          email: cleanEmail,
          password:
            hashedPassword,
          phone:
            phone || "",
          location:
            location || "",
          farmName:
            farmName || "My Farm"
        });

      const savedFarmer =
        await newFarmer.save();

      const farmerObject =
        savedFarmer.toObject();

      delete farmerObject.password;

      console.log(
        "👨‍🌾 Farmer added:",
        savedFarmer.name
      );

      res.status(201).json({
        message:
          "Farmer profile created successfully",
        farmer:
          farmerObject
      });

    } catch (error) {
      console.log(
        "Create farmer error:",
        error.message
      );

      res.status(500).json({
        message:
          "Failed to create farmer profile"
      });
    }
  }
);

/* =========================================================
   GET FARMERS
========================================================= */

app.get(
  "/api/farmers",
  async (req, res) => {
    try {
      const farmers =
        await Farmer.find()
          .select("-password")
          .sort({
            createdAt: -1
          });

      res.json(
        farmers
      );

    } catch (error) {
      console.log(
        "Fetch farmers error:",
        error.message
      );

      res.status(500).json({
        message:
          "Failed to fetch farmers"
      });
    }
  }
);

/* =========================================================
   GET SINGLE FARMER
========================================================= */

app.get(
  "/api/farmers/:id",
  async (req, res) => {
    try {
      const farmer =
        await Farmer.findById(
          req.params.id
        ).select("-password");

      if (!farmer) {
        return res.status(404).json({
          message:
            "Farmer not found"
        });
      }

      res.json(
        farmer
      );

    } catch (error) {
      console.log(
        "Get farmer error:",
        error.message
      );

      res.status(500).json({
        message:
          "Failed to fetch farmer"
      });
    }
  }
);

/* =========================================================
   UPDATE FARMER PROFILE
========================================================= */

app.put(
  "/api/farmers/:id",
  async (req, res) => {
    try {
      const {
        name,
        email,
        phone,
        location,
        farmName
      } = req.body;

      const updatedFarmer =
        await Farmer.findByIdAndUpdate(
          req.params.id,
          {
            name,
            email: email
              ? email
                  .trim()
                  .toLowerCase()
              : undefined,
            phone,
            location,
            farmName
          },
          {
            new: true,
            runValidators: true
          }
        ).select("-password");

      if (!updatedFarmer) {
        return res.status(404).json({
          message:
            "Farmer not found"
        });
      }

      res.json({
        message:
          "Farmer profile updated successfully",
        farmer:
          updatedFarmer
      });

    } catch (error) {
      console.log(
        "Update farmer error:",
        error.message
      );

      res.status(500).json({
        message:
          "Failed to update farmer profile"
      });
    }
  }
);

/* =========================================================
   BIDS
========================================================= */

/* =========================================================
   CREATE BID
========================================================= */

app.post(
  "/api/bids",
  async (req, res) => {
    try {
      const {
        produceId,
        buyerId,
        buyerName,
        crop,
        quantity,
        bidPrice
      } = req.body;

      if (
        !produceId ||
        !buyerId ||
        !buyerName ||
        !crop ||
        !quantity ||
        !bidPrice
      ) {
        return res.status(400).json({
          message:
            "All bid details are required"
        });
      }

      const newBid =
        new Bid({
          produceId,
          buyerId,
          buyerName,
          crop,
          quantity,
          bidPrice,
          originalBidPrice:
            Number(bidPrice),
          status:
            "Pending",

          negotiationHistory: [
            {
              by:
                "Buyer",

              price:
                Number(bidPrice),

              message:
                "Initial bid placed",

              status:
                "Pending"
            }
          ]
        });

      const savedBid =
        await newBid.save();

      console.log(
        "💰 Bid placed:",
        savedBid.crop,
        "₹" +
          savedBid.bidPrice
      );

      res.status(201).json({
        message:
          "Bid placed successfully",
        bid:
          savedBid
      });

    } catch (error) {
      console.log(
        "Create bid error:",
        error.message
      );

      res.status(500).json({
        message:
          "Failed to place bid"
      });
    }
  }
);

/* =========================================================
   GET ALL BIDS
========================================================= */

app.get(
  "/api/bids",
  async (req, res) => {
    try {
      const bids =
        await Bid.find()
          .sort({
            createdAt: -1
          });

      res.json(
        bids
      );

    } catch (error) {
      console.log(
        "Fetch bids error:",
        error.message
      );

      res.status(500).json({
        message:
          "Failed to fetch bids"
      });
    }
  }
);

/* =========================================================
   GET BIDS FOR BUYER
========================================================= */

app.get(
  "/api/bids/buyer/:buyerId",
  async (req, res) => {
    try {
      const bids =
        await Bid.find({
          buyerId:
            req.params.buyerId
        }).sort({
          createdAt: -1
        });

      res.json(
        bids
      );

    } catch (error) {
      console.log(
        "Fetch buyer bids error:",
        error.message
      );

      res.status(500).json({
        message:
          "Failed to fetch buyer bids"
      });
    }
  }
);

/* =========================================================
   GET BIDS FOR PRODUCE
========================================================= */

app.get(
  "/api/bids/produce/:produceId",
  async (req, res) => {
    try {
      const bids =
        await Bid.find({
          produceId:
            req.params.produceId
        }).sort({
          createdAt: -1
        });

      res.json(
        bids
      );

    } catch (error) {
      console.log(
        "Fetch produce bids error:",
        error.message
      );

      res.status(500).json({
        message:
          "Failed to fetch produce bids"
      });
    }
  }
);

/* =========================================================
   UPDATE BID
========================================================= */

app.put(
  "/api/bids/:id",
  async (req, res) => {
    try {
      const {
        status,
        counterOfferPrice,
        negotiationMessage,
        by
      } = req.body;

      console.log(
        "BID UPDATE:",
        {
          status,
          counterOfferPrice,
          by
        }
      );

      const bid =
        await Bid.findById(
          req.params.id
        );

      if (!bid) {
        return res.status(404).json({
          message:
            "Bid not found"
        });
      }

      /* ================================
         FIX OLD BIDS
      ================================= */

      if (
        bid.originalBidPrice ===
          undefined ||
        bid.originalBidPrice ===
          null
      ) {
        bid.originalBidPrice =
          bid.bidPrice;
      }

      /* ================================
         ACCEPT / REJECT
      ================================= */

      if (
        status === "Accepted" ||
        status === "Rejected"
      ) {
        bid.status =
          status;

        bid.negotiationHistory.push({
          by:
            by === "Buyer"
              ? "Buyer"
              : "Farmer",

          price:
            Number(bid.bidPrice),

          message:
            negotiationMessage ||
            `Bid ${status.toLowerCase()}`,

          status,

          createdAt:
            new Date()
        });

        await bid.save();

        return res.json({
          message:
            `Bid ${status.toLowerCase()} successfully`,
          bid
        });
      }

      /* ================================
         COUNTER OFFER
      ================================= */

      if (
        status === "Counter Offer"
      ) {
        if (
          counterOfferPrice ===
            undefined ||
          counterOfferPrice ===
            null ||
          Number(counterOfferPrice) <=
            0
        ) {
          return res.status(400).json({
            message:
              "Valid counter offer price is required"
          });
        }

        if (
          by !== "Farmer" &&
          by !== "Buyer"
        ) {
          return res.status(400).json({
            message:
              "Counter offer must be from Farmer or Buyer"
          });
        }

        const newPrice =
          Number(
            counterOfferPrice
          );

        bid.counterOfferPrice =
          newPrice;

        bid.counterOfferBy =
          by;

        bid.negotiationMessage =
          negotiationMessage ||
          "";

        bid.bidPrice =
          newPrice;

        bid.status =
          "Counter Offer";

        bid.negotiationHistory.push({
          by,

          price:
            newPrice,

          message:
            negotiationMessage ||
            "Counter offer submitted",

          status:
            "Counter Offer",

          createdAt:
            new Date()
        });

        await bid.save();

        return res.json({
          message:
            "Counter offer submitted successfully",
          bid
        });
      }

      /* ================================
         PENDING
      ================================= */

      if (
        status === "Pending"
      ) {
        bid.status =
          "Pending";

        await bid.save();

        return res.json({
          message:
            "Bid moved to pending",
          bid
        });
      }

      return res.status(400).json({
        message:
          "Invalid bid status"
      });

    } catch (error) {
      console.log(
        "Update bid error:",
        error.message
      );

      res.status(500).json({
        message:
          "Failed to update bid",
        error:
          error.message
      });
    }
  }
);

/* =========================================================
   AI FORECAST
========================================================= */

app.post(
  "/api/ai/forecast",
  async (req, res) => {
    try {
      const {
        crop,
        quantity,
        quality,
        harvestDate,
        location,
        expectedPrice
      } = req.body;

      if (
        !crop ||
        !quantity ||
        !quality ||
        !harvestDate ||
        !location ||
        !expectedPrice
      ) {
        return res.status(400).json({
          success: false,
          message:
            "All crop details are required"
        });
      }

      const prompt = `
You are AgriDirect AI, an agricultural market decision-support assistant.

Analyze this farmer's produce:

Crop: ${crop}
Quantity: ${quantity} kg
Quality: ${quality}
Harvest Date: ${harvestDate}
Location: ${location}
Farmer Expected Price: ₹${expectedPrice}/kg

Give a practical selling recommendation.

Return ONLY valid JSON:

{
  "predictedPrice": 0,
  "recommendedPrice": 0,
  "demand": "HIGH",
  "recommendation": "SELL NOW",
  "confidence": 0,
  "reason": "short explanation",
  "action": "short practical action"
}

Rules:
- predictedPrice: INR per kg number
- recommendedPrice: INR per kg number
- demand: HIGH, MEDIUM, or LOW
- recommendation: SELL NOW, WAIT, or NEGOTIATE
- confidence: number from 0 to 100
- reason: short
- action: short and practical
- Do not use markdown
- Do not add text outside JSON
- This is an AI estimate, not a live market price
`;

      console.log(
        "🤖 Sending request to Gemini..."
      );

      const response =
        await ai.models.generateContent({
          model:
            "gemini-3.5-flash-lite",
          contents:
            prompt
        });

      const text =
        response.text.trim();

      console.log(
        "🤖 Gemini response received"
      );

      console.log(
        "AI RAW RESPONSE:",
        text
      );

      const cleanedText =
        text
          .replace(
            /```json/g,
            ""
          )
          .replace(
            /```/g,
            ""
          )
          .trim();

      const forecast =
        JSON.parse(
          cleanedText
        );

      res.json({
        success: true,
        forecast
      });

    } catch (error) {
      console.log(
        "AI Forecast error:",
        error.message ||
          error
      );

      if (
        error.message &&
        (
          error.message.includes(
            "429"
          ) ||
          error.message.includes(
            "quota"
          ) ||
          error.message.includes(
            "RESOURCE_EXHAUSTED"
          )
        )
      ) {
        return res.status(429).json({
          success: false,
          message:
            "AI quota exceeded. Please try again later."
        });
      }

      res.status(500).json({
        success: false,
        message:
          error.message ||
          "AI forecast failed"
      });
    }
  }
);

/* =========================================================
   HEALTH CHECK
========================================================= */

app.get(
  "/",
  (req, res) => {
    res.json({
      status: "ok",
      message:
        "AgriDirect AI backend is running"
    });
  }
);

/* =========================================================
   START SERVER
========================================================= */

const PORT = process.env.PORT || 5001;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.log(
      "❌ MongoDB connection failed:",
      error.message
    );
  });