const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const Buyer = require("../models/Buyer");
const Farmer = require("../models/Farmer");

/* =========================================================
   BUYER ENDPOINTS
========================================================= */

// Create Buyer
router.post("/buyers", async (req, res) => {
  try {
    const { name, email, password, businessName, phone, location, buyerType, interestedCrops } = req.body;

    if (!name || !email || !password || !businessName || !phone || !location || !buyerType) {
      return res.status(400).json({ message: "All buyer details are required" });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existingBuyer = await Buyer.findOne({ email: cleanEmail });

    if (existingBuyer) {
      return res.status(409).json({ message: "An account with this email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newBuyer = new Buyer({
      name,
      email: cleanEmail,
      password: hashedPassword,
      businessName,
      phone,
      location,
      buyerType,
      interestedCrops: interestedCrops || []
    });

    const savedBuyer = await newBuyer.save();
    const buyerObject = savedBuyer.toObject();
    delete buyerObject.password;

    console.log("👨‍💼 Buyer added:", savedBuyer.businessName);
    res.status(201).json({ message: "Buyer registered successfully", buyer: buyerObject });
  } catch (error) {
    console.log("Create buyer error:", error.message);
    res.status(500).json({ message: "Failed to register buyer" });
  }
});

// Get Buyers
router.get("/buyers", async (req, res) => {
  try {
    const buyers = await Buyer.find().select("-password").sort({ createdAt: -1 });
    res.json(buyers);
  } catch (error) {
    console.log("Fetch buyers error:", error.message);
    res.status(500).json({ message: "Failed to fetch buyers" });
  }
});

// Get Single Buyer
router.get("/buyers/:id", async (req, res) => {
  try {
    const buyer = await Buyer.findById(req.params.id).select("-password");
    if (!buyer) {
      return res.status(404).json({ message: "Buyer not found" });
    }
    res.json(buyer);
  } catch (error) {
    console.log("Get buyer error:", error.message);
    res.status(500).json({ message: "Failed to fetch buyer" });
  }
});

// Update Buyer Profile
router.put("/buyers/:id", async (req, res) => {
  try {
    const { name, email, businessName, phone, location, buyerType, interestedCrops } = req.body;
    const updatedBuyer = await Buyer.findByIdAndUpdate(
      req.params.id,
      {
        name,
        email: email ? email.trim().toLowerCase() : undefined,
        businessName,
        phone,
        location,
        buyerType,
        interestedCrops
      },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedBuyer) {
      return res.status(404).json({ message: "Buyer not found" });
    }

    res.json({ message: "Profile updated successfully", buyer: updatedBuyer });
  } catch (error) {
    console.log("Update buyer error:", error.message);
    res.status(500).json({ message: "Failed to update buyer profile" });
  }
});

/* =========================================================
   FARMER ENDPOINTS
========================================================= */

// Create Farmer
router.post("/farmers", async (req, res) => {
  try {
    const { name, email, password, phone, location, farmName } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existingFarmer = await Farmer.findOne({ email: cleanEmail });

    if (existingFarmer) {
      return res.status(409).json({ message: "An account with this email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newFarmer = new Farmer({
      name,
      email: cleanEmail,
      password: hashedPassword,
      phone: phone || "",
      location: location || "",
      farmName: farmName || "My Farm"
    });

    const savedFarmer = await newFarmer.save();
    const farmerObject = savedFarmer.toObject();
    delete farmerObject.password;

    console.log("👨‍🌾 Farmer added:", savedFarmer.name);
    res.status(201).json({ message: "Farmer profile created successfully", farmer: farmerObject });
  } catch (error) {
    console.log("Create farmer error:", error.message);
    res.status(500).json({ message: "Failed to create farmer profile" });
  }
});

// Get Farmers
router.get("/farmers", async (req, res) => {
  try {
    const farmers = await Farmer.find().select("-password").sort({ createdAt: -1 });
    res.json(farmers);
  } catch (error) {
    console.log("Fetch farmers error:", error.message);
    res.status(500).json({ message: "Failed to fetch farmers" });
  }
});

// Get Single Farmer
router.get("/farmers/:id", async (req, res) => {
  try {
    const farmer = await Farmer.findById(req.params.id).select("-password");
    if (!farmer) {
      return res.status(404).json({ message: "Farmer not found" });
    }
    res.json(farmer);
  } catch (error) {
    console.log("Get farmer error:", error.message);
    res.status(500).json({ message: "Failed to fetch farmer" });
  }
});

// Update Farmer Profile
router.put("/farmers/:id", async (req, res) => {
  try {
    const { name, email, phone, location, farmName } = req.body;
    const updatedFarmer = await Farmer.findByIdAndUpdate(
      req.params.id,
      {
        name,
        email: email ? email.trim().toLowerCase() : undefined,
        phone,
        location,
        farmName
      },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedFarmer) {
      return res.status(404).json({ message: "Farmer not found" });
    }

    res.json({ message: "Farmer profile updated successfully", farmer: updatedFarmer });
  } catch (error) {
    console.log("Update farmer error:", error.message);
    res.status(500).json({ message: "Failed to update farmer profile" });
  }
});

module.exports = router;
