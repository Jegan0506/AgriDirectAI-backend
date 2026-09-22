const express = require("express");
const router = express.Router();
const Produce = require("../models/Produce");

/* =========================================================
   GET ALL PRODUCE
========================================================= */
router.get("/", async (req, res) => {
  try {
    const produceList = await Produce.find().sort({ createdAt: -1 });
    res.json(produceList);
  } catch (error) {
    console.log("Fetch produce error:", error.message);
    res.status(500).json({
      message: "Failed to fetch produce"
    });
  }
});

/* =========================================================
   ADD PRODUCE
========================================================= */
router.post("/", async (req, res) => {
  try {
    const { crop, quantity, quality, harvestDate, location, expectedPrice, photo, farmerId } = req.body;

    if (!crop || !quantity || !quality || !harvestDate || !location || !expectedPrice) {
      return res.status(400).json({
        message: "All crop details are required"
      });
    }

    const newProduce = new Produce({
      crop,
      quantity,
      quality,
      harvestDate,
      location,
      expectedPrice,
      photo: photo || "",
      farmerId: farmerId || null
    });

    const savedProduce = await newProduce.save();
    console.log("🌾 Produce added:", savedProduce.crop);

    res.status(201).json({
      message: "Produce added successfully",
      produce: savedProduce
    });
  } catch (error) {
    console.log("Add produce error:", error.message);
    res.status(500).json({
      message: "Failed to add produce"
    });
  }
});

/* =========================================================
   UPDATE PRODUCE
========================================================= */
router.put("/:id", async (req, res) => {
  try {
    const updatedProduce = await Produce.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedProduce) {
      return res.status(404).json({
        message: "Produce not found"
      });
    }

    res.json({
      message: "Produce updated successfully",
      produce: updatedProduce
    });
  } catch (error) {
    console.log("Update produce error:", error.message);
    res.status(500).json({
      message: "Failed to update produce"
    });
  }
});

/* =========================================================
   DELETE PRODUCE
========================================================= */
router.delete("/:id", async (req, res) => {
  try {
    const deletedProduce = await Produce.findByIdAndDelete(req.params.id);

    if (!deletedProduce) {
      return res.status(404).json({
        message: "Produce not found"
      });
    }

    res.json({
      message: "Produce deleted successfully"
    });
  } catch (error) {
    console.log("Delete produce error:", error.message);
    res.status(500).json({
      message: "Failed to delete produce"
    });
  }
});

module.exports = router;
