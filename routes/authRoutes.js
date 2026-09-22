const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const Farmer = require("../models/Farmer");
const Buyer = require("../models/Buyer");
const Transporter = require("../models/Transporter");

/* =========================================================
   REGISTER
========================================================= */
router.post("/register", async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;

    if (!name || !email || !phone || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "All details are required"
      });
    }

    if (role !== "farmer" && role !== "buyer" && role !== "transporter") {
      return res.status(400).json({
        success: false,
        message: "Invalid role"
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least 6 characters"
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    const existingFarmer = await Farmer.findOne({ email: cleanEmail });
    const existingBuyer = await Buyer.findOne({ email: cleanEmail });
    const existingTransporter = await Transporter.findOne({ email: cleanEmail });

    if (existingFarmer || existingBuyer || existingTransporter) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    let user;

    if (role === "farmer") {
      user = new Farmer({
        name,
        email: cleanEmail,
        password: hashedPassword,
        phone,
        location: "",
        farmName: "My Farm"
      });
      user = await user.save();
    }

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
      user = await user.save();
    }

    if (role === "transporter") {
      user = new Transporter({
        name,
        email: cleanEmail,
        password: hashedPassword,
        companyName: name + " Transports",
        phone,
        vehicleType: "Mini Truck",
        operatingLocation: "Tamil Nadu"
      });
      user = await user.save();
    }

    const userObject = user.toObject();
    delete userObject.password;

    console.log(`🆕 ${role} registered:`, cleanEmail);

    res.status(201).json({
      success: true,
      message: "Account created successfully",
      role,
      user: userObject
    });
  } catch (error) {
    console.log("Registration error:", error.message);
    res.status(500).json({
      success: false,
      message: "Registration failed"
    });
  }
});

/* =========================================================
   LOGIN
========================================================= */
router.post("/login", async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "Email, password and role are required"
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    let user = null;

    if (role === "farmer") {
      user = await Farmer.findOne({ email: cleanEmail });
    }

    if (role === "buyer") {
      user = await Buyer.findOne({ email: cleanEmail });
    }

    if (role === "transporter") {
      user = await Transporter.findOne({ email: cleanEmail });
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Account not found"
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Incorrect password"
      });
    }

    const userObject = user.toObject();
    delete userObject.password;

    console.log(`🔐 ${role} logged in:`, user.email);

    res.json({
      success: true,
      message: "Login successful",
      role,
      user: userObject
    });
  } catch (error) {
    console.log("Login error:", error.message);
    res.status(500).json({
      success: false,
      message: "Login failed"
    });
  }
});

module.exports = router;
