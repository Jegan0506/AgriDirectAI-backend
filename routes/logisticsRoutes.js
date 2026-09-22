const express = require("express");
const router = express.Router();
const Logistics = require("../models/Logistics");

// Vehicle auto-suggestion helper
const suggestVehicle = (quantity, crop) => {
  const qty = Number(quantity);
  const perishableCrops = ["tomato", "strawberries", "banana", "mango", "milk", "grapes", "flowers"];
  const isPerishable = perishableCrops.some((c) => crop.toLowerCase().includes(c));

  if (isPerishable && qty > 500) {
    return "Refrigerated Truck";
  }
  if (qty <= 1000) {
    return "Mini Truck";
  }
  if (qty <= 3500) {
    return "Light Commercial Vehicle";
  }
  return "Truck";
};

// Route scoring & cost calculation helper
const calculateRoutes = (pickup, destination, vehicleType, quantity) => {
  const distBase = Math.floor(Math.random() * 150) + 340; // 340-490 km
  const qty = Number(quantity) || 1000;

  // Commercial base trip hire rates in Tamil Nadu / India
  let baseHireRate = 18500; // Mini Truck base
  let perKmRate = 22;
  let handlingRatePerKg = 2.5;

  if (vehicleType === "Light Commercial Vehicle") {
    baseHireRate = 32500;
    perKmRate = 35;
    handlingRatePerKg = 3.5;
  } else if (vehicleType === "Truck") {
    baseHireRate = 54000;
    perKmRate = 55;
    handlingRatePerKg = 4.5;
  } else if (vehicleType === "Refrigerated Truck") {
    baseHireRate = 68000;
    perKmRate = 75;
    handlingRatePerKg = 6.0;
  }

  // Route A (Direct NH Highway)
  const distA = distBase;
  const timeAHours = Math.floor(distA / 55);
  const timeAMins = Math.floor((distA % 55) * 1.1);
  const fuelCostA = Math.round(distA * (perKmRate * 0.48));
  const tollCostA = Math.round((distA / 100) * 650);
  const handlingCostA = Math.round(qty * handlingRatePerKg + 2000);
  const totalCostA = baseHireRate;
  const scoreA = 91;

  // Route B (State Highway)
  const distB = distBase + 35;
  const timeBHours = Math.floor(distB / 48);
  const timeBMins = Math.floor((distB % 48) * 1.2);
  const fuelCostB = Math.round(distB * (perKmRate * 0.52));
  const tollCostB = Math.round((distB / 100) * 450);
  const handlingCostB = handlingCostA;
  const totalCostB = totalCostA + 2800;
  const scoreB = 84;

  // Route C (Bypass Corridor)
  const distC = distBase + 65;
  const timeCHours = Math.floor(distC / 42);
  const timeCMins = Math.floor((distC % 42) * 1.3);
  const fuelCostC = Math.round(distC * (perKmRate * 0.56));
  const tollCostC = Math.round((distC / 100) * 900);
  const handlingCostC = handlingCostA + 1500;
  const totalCostC = totalCostA + 5400;
  const scoreC = 76;

  return [
    {
      id: "route_a",
      name: `Route A (${pickup} → Direct Highway → ${destination})`,
      via: "NH Highways (Fastest & Lowest Fuel)",
      distanceKm: distA,
      estimatedTime: `${timeAHours}h ${timeAMins}m`,
      fuelCost: fuelCostA,
      tollCost: tollCostA,
      handlingCost: handlingCostA,
      totalCost: totalCostA,
      routeScore: scoreA,
      recommended: true,
      reason: "Shortest travel time, highest fuel efficiency, and smooth road conditions for produce safety."
    },
    {
      id: "route_b",
      name: `Route B (${pickup} → State Highway → ${destination})`,
      via: "State Highway (Lower Tolls)",
      distanceKm: distB,
      estimatedTime: `${timeBHours}h ${timeBMins}m`,
      fuelCost: fuelCostB,
      tollCost: tollCostB,
      handlingCost: handlingCostB,
      totalCost: totalCostB,
      routeScore: scoreB,
      recommended: false,
      reason: "Slightly longer travel time with moderate toll savings."
    },
    {
      id: "route_c",
      name: `Route C (${pickup} → Bypass Ring → ${destination})`,
      via: "Bypass Corridor (Avoids City Traffic)",
      distanceKm: distC,
      estimatedTime: `${timeCHours}h ${timeCMins}m`,
      fuelCost: fuelCostC,
      tollCost: tollCostC,
      handlingCost: handlingCostC,
      totalCost: totalCostC,
      routeScore: scoreC,
      recommended: false,
      reason: "Longer distance but bypasses major urban congestion during peak hours."
    }
  ];
};

// Transporter matching helper
const generateTransporters = (vehicleType, pickup, baseFreight = 18500) => {
  const cost1 = baseFreight;
  const cost2 = Math.round(baseFreight * 1.08);
  const cost3 = Math.round(baseFreight * 0.94);

  return [
    {
      id: "trans_1",
      name: "Kongu Express Logistics",
      phone: "+91 98421 88321",
      vehicleType: vehicleType,
      capacity: vehicleType === "Mini Truck" ? "1.5 Tons" : vehicleType === "Light Commercial Vehicle" ? "4.5 Tons" : "12 Tons",
      distanceFromPickupKm: 12,
      availability: "Immediate",
      estimatedCost: cost1,
      matchScore: 92,
      rating: 4.8,
      recommended: true
    },
    {
      id: "trans_2",
      name: "GreenField Agro Transports",
      phone: "+91 97892 11400",
      vehicleType: vehicleType,
      capacity: vehicleType === "Mini Truck" ? "2.0 Tons" : vehicleType === "Light Commercial Vehicle" ? "5.5 Tons" : "15 Tons",
      distanceFromPickupKm: 28,
      availability: "Same Day",
      estimatedCost: cost2,
      matchScore: 84,
      rating: 4.6,
      recommended: false
    },
    {
      id: "trans_3",
      name: "Uzhavar Direct Freight Co.",
      phone: "+91 94432 77099",
      vehicleType: vehicleType,
      capacity: vehicleType === "Mini Truck" ? "1.2 Tons" : vehicleType === "Light Commercial Vehicle" ? "4.0 Tons" : "10 Tons",
      distanceFromPickupKm: 45,
      availability: "Tomorrow Morning",
      estimatedCost: cost3,
      matchScore: 78,
      rating: 4.5,
      recommended: false
    }
  ];
};

/* =========================================================
   CREATE DELIVERY
========================================================= */
router.post("/", async (req, res) => {
  try {
    const {
      produceId,
      bidId,
      farmerId,
      buyerId,
      farmerName,
      buyerName,
      crop,
      quantity,
      pickupLocation,
      destination,
      preferredPickupDate,
      deliveryPriority,
      vehicleType
    } = req.body;

    if (!crop || !quantity || !pickupLocation || !destination) {
      return res.status(400).json({ success: false, message: "Crop, quantity, pickup, and destination are required" });
    }

    const autoVehicle = suggestVehicle(quantity, crop);
    const chosenVehicle = vehicleType || autoVehicle;

    // Run route & transporter matching logic
    const routes = calculateRoutes(pickupLocation, destination, chosenVehicle, quantity);
    const topRoute = routes[0];
    const transporters = generateTransporters(chosenVehicle, pickupLocation);
    const topTransporter = transporters[0];

    const newDelivery = new Logistics({
      produceId: produceId || null,
      bidId: bidId || null,
      farmerId: farmerId || null,
      buyerId: buyerId || null,
      farmerName: farmerName || "Farmer",
      buyerName: buyerName || "Buyer",
      crop,
      quantity: Number(quantity),
      pickupLocation,
      destination,
      preferredPickupDate: preferredPickupDate || new Date().toISOString().split("T")[0],
      deliveryPriority: deliveryPriority || "Normal",
      vehicleType: chosenVehicle,
      suggestedVehicle: autoVehicle,
      transporterId: topTransporter.id,
      transporterName: topTransporter.name,
      transporterPhone: topTransporter.phone,
      estimatedDistance: topRoute.distanceKm,
      estimatedTime: topRoute.estimatedTime,
      transportCost: topRoute.totalCost,
      fuelCost: topRoute.fuelCost,
      tollCost: topRoute.tollCost,
      handlingCost: topRoute.handlingCost,
      selectedRoute: topRoute,
      routeScore: topRoute.routeScore,
      availableRoutes: routes,
      matchedTransporters: transporters,
      status: "Transport Matched"
    });

    const savedDelivery = await newDelivery.save();
    console.log("🚚 Delivery created & transport matched:", savedDelivery.crop, savedDelivery.status);

    res.status(201).json({
      success: true,
      message: "Delivery created and transport matched successfully",
      delivery: savedDelivery
    });
  } catch (error) {
    console.log("Create delivery error:", error.message);
    res.status(500).json({ success: false, message: "Failed to create delivery", error: error.message });
  }
});

/* =========================================================
   GET ALL DELIVERIES
========================================================= */
router.get("/", async (req, res) => {
  try {
    const deliveries = await Logistics.find().sort({ createdAt: -1 });
    res.json(deliveries);
  } catch (error) {
    console.log("Fetch deliveries error:", error.message);
    res.status(500).json({ message: "Failed to fetch deliveries" });
  }
});

/* =========================================================
   GET FARMER DELIVERIES
========================================================= */
router.get("/farmer/:farmerId", async (req, res) => {
  try {
    const deliveries = await Logistics.find({ farmerId: req.params.farmerId }).sort({ createdAt: -1 });
    res.json(deliveries);
  } catch (error) {
    console.log("Fetch farmer deliveries error:", error.message);
    res.status(500).json({ message: "Failed to fetch farmer deliveries" });
  }
});

/* =========================================================
   GET BUYER DELIVERIES
========================================================= */
router.get("/buyer/:buyerId", async (req, res) => {
  try {
    const deliveries = await Logistics.find({ buyerId: req.params.buyerId }).sort({ createdAt: -1 });
    res.json(deliveries);
  } catch (error) {
    console.log("Fetch buyer deliveries error:", error.message);
    res.status(500).json({ message: "Failed to fetch buyer deliveries" });
  }
});

/* =========================================================
   GET SINGLE DELIVERY
========================================================= */
router.get("/:id", async (req, res) => {
  try {
    const delivery = await Logistics.findById(req.params.id);
    if (!delivery) {
      return res.status(404).json({ message: "Delivery not found" });
    }
    res.json(delivery);
  } catch (error) {
    console.log("Get delivery error:", error.message);
    res.status(500).json({ message: "Failed to fetch delivery" });
  }
});

/* =========================================================
   MATCH TRANSPORT (API RE-EVALUATION)
========================================================= */
router.post("/:id/match-transport", async (req, res) => {
  try {
    const delivery = await Logistics.findById(req.params.id);
    if (!delivery) {
      return res.status(404).json({ message: "Delivery not found" });
    }

    const transporters = generateTransporters(delivery.vehicleType, delivery.pickupLocation);
    delivery.matchedTransporters = transporters;
    delivery.status = "Finding Transport";
    await delivery.save();

    res.json({
      success: true,
      message: "Transporters matched successfully",
      transporters
    });
  } catch (error) {
    console.log("Match transport error:", error.message);
    res.status(500).json({ message: "Failed to match transport" });
  }
});

/* =========================================================
   OPTIMIZE ROUTE (AI MULTI-ROUTE EVALUATION)
========================================================= */
router.post("/:id/optimize-route", async (req, res) => {
  try {
    const delivery = await Logistics.findById(req.params.id);
    if (!delivery) {
      return res.status(404).json({ message: "Delivery not found" });
    }

    const routes = calculateRoutes(delivery.pickupLocation, delivery.destination, delivery.vehicleType, delivery.quantity);
    delivery.availableRoutes = routes;
    delivery.selectedRoute = routes[0];
    delivery.routeScore = routes[0].routeScore;
    delivery.estimatedDistance = routes[0].distanceKm;
    delivery.estimatedTime = routes[0].estimatedTime;
    delivery.transportCost = routes[0].totalCost;
    delivery.fuelCost = routes[0].fuelCost;
    delivery.tollCost = routes[0].tollCost;
    delivery.handlingCost = routes[0].handlingCost;

    await delivery.save();

    res.json({
      success: true,
      message: "AI Route optimization completed",
      routes,
      recommendedRoute: routes[0]
    });
  } catch (error) {
    console.log("Route optimization error:", error.message);
    res.status(500).json({ message: "Failed to optimize route" });
  }
});

/* =========================================================
   SELECT ROUTE & TRANSPORTER
========================================================= */
router.put("/:id/select-transport", async (req, res) => {
  try {
    const { transporterId, routeId } = req.body;
    const delivery = await Logistics.findById(req.params.id);
    if (!delivery) {
      return res.status(404).json({ message: "Delivery not found" });
    }

    if (transporterId && delivery.matchedTransporters) {
      const selectedT = delivery.matchedTransporters.find((t) => t.id === transporterId);
      if (selectedT) {
        delivery.transporterId = selectedT.id;
        delivery.transporterName = selectedT.name;
        delivery.transporterPhone = selectedT.phone;
      }
    }

    if (routeId && delivery.availableRoutes) {
      const selectedR = delivery.availableRoutes.find((r) => r.id === routeId);
      if (selectedR) {
        delivery.selectedRoute = selectedR;
        delivery.routeScore = selectedR.routeScore;
        delivery.estimatedDistance = selectedR.distanceKm;
        delivery.estimatedTime = selectedR.estimatedTime;
        delivery.transportCost = selectedR.totalCost;
        delivery.fuelCost = selectedR.fuelCost;
        delivery.tollCost = selectedR.tollCost;
        delivery.handlingCost = selectedR.handlingCost;
      }
    }

    delivery.status = "Pickup Scheduled";
    await delivery.save();

    res.json({
      success: true,
      message: "Transport and route updated successfully",
      delivery
    });
  } catch (error) {
    console.log("Select transport error:", error.message);
    res.status(500).json({ message: "Failed to select transport" });
  }
});

/* =========================================================
   UPDATE DELIVERY STATUS
========================================================= */
router.put("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const delivery = await Logistics.findById(req.params.id);
    if (!delivery) {
      return res.status(404).json({ message: "Delivery not found" });
    }

    delivery.status = status;
    if (status === "Delivered") {
      delivery.deliveryDate = new Date().toISOString().split("T")[0];
    }

    await delivery.save();
    console.log("🚚 Delivery status updated:", delivery._id, status);

    res.json({
      success: true,
      message: `Delivery status updated to ${status}`,
      delivery
    });
  } catch (error) {
    console.log("Update status error:", error.message);
    res.status(500).json({ message: "Failed to update delivery status" });
  }
});

module.exports = router;
