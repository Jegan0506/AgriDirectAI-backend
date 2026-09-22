const express = require("express");
const router = express.Router();
const Bid = require("../models/Bid");

/* =========================================================
   CREATE BID
========================================================= */
router.post("/", async (req, res) => {
  try {
    const { produceId, buyerId, buyerName, crop, quantity, bidPrice } = req.body;

    if (!produceId || !buyerId || !buyerName || !crop || !quantity || !bidPrice) {
      return res.status(400).json({ message: "All bid details are required" });
    }

    const newBid = new Bid({
      produceId,
      buyerId,
      buyerName,
      crop,
      quantity,
      bidPrice,
      originalBidPrice: Number(bidPrice),
      status: "Pending",
      negotiationHistory: [
        {
          by: "Buyer",
          price: Number(bidPrice),
          message: "Initial bid placed",
          status: "Pending"
        }
      ]
    });

    const savedBid = await newBid.save();
    console.log("💰 Bid placed:", savedBid.crop, "₹" + savedBid.bidPrice);

    res.status(201).json({
      message: "Bid placed successfully",
      bid: savedBid
    });
  } catch (error) {
    console.log("Create bid error:", error.message);
    res.status(500).json({ message: "Failed to place bid" });
  }
});

/* =========================================================
   GET ALL BIDS
========================================================= */
router.get("/", async (req, res) => {
  try {
    const bids = await Bid.find().sort({ createdAt: -1 });
    res.json(bids);
  } catch (error) {
    console.log("Fetch bids error:", error.message);
    res.status(500).json({ message: "Failed to fetch bids" });
  }
});

/* =========================================================
   GET BIDS FOR BUYER
========================================================= */
router.get("/buyer/:buyerId", async (req, res) => {
  try {
    const bids = await Bid.find({ buyerId: req.params.buyerId }).sort({ createdAt: -1 });
    res.json(bids);
  } catch (error) {
    console.log("Fetch buyer bids error:", error.message);
    res.status(500).json({ message: "Failed to fetch buyer bids" });
  }
});

/* =========================================================
   GET BIDS FOR PRODUCE
========================================================= */
router.get("/produce/:produceId", async (req, res) => {
  try {
    const bids = await Bid.find({ produceId: req.params.produceId }).sort({ createdAt: -1 });
    res.json(bids);
  } catch (error) {
    console.log("Fetch produce bids error:", error.message);
    res.status(500).json({ message: "Failed to fetch produce bids" });
  }
});

/* =========================================================
   UPDATE BID (ACCEPT, REJECT, COUNTER OFFER)
========================================================= */
router.put("/:id", async (req, res) => {
  try {
    const { status, counterOfferPrice, negotiationMessage, by } = req.body;
    console.log("BID UPDATE:", { status, counterOfferPrice, by });

    const bid = await Bid.findById(req.params.id);

    if (!bid) {
      return res.status(404).json({ message: "Bid not found" });
    }

    if (bid.originalBidPrice === undefined || bid.originalBidPrice === null) {
      bid.originalBidPrice = bid.bidPrice;
    }

    /* ACCEPT / REJECT */
    if (status === "Accepted" || status === "Rejected") {
      bid.status = status;
      bid.negotiationHistory.push({
        by: by === "Buyer" ? "Buyer" : "Farmer",
        price: Number(bid.bidPrice),
        message: negotiationMessage || `Bid ${status.toLowerCase()}`,
        status,
        createdAt: new Date()
      });

      await bid.save();
      return res.json({
        message: `Bid ${status.toLowerCase()} successfully`,
        bid
      });
    }

    /* COUNTER OFFER */
    if (status === "Counter Offer") {
      if (counterOfferPrice === undefined || counterOfferPrice === null || Number(counterOfferPrice) <= 0) {
        return res.status(400).json({ message: "Valid counter offer price is required" });
      }

      if (by !== "Farmer" && by !== "Buyer") {
        return res.status(400).json({ message: "Counter offer must be from Farmer or Buyer" });
      }

      const newPrice = Number(counterOfferPrice);
      bid.counterOfferPrice = newPrice;
      bid.counterOfferBy = by;
      bid.negotiationMessage = negotiationMessage || "";
      bid.bidPrice = newPrice;
      bid.status = "Counter Offer";

      bid.negotiationHistory.push({
        by,
        price: newPrice,
        message: negotiationMessage || "Counter offer submitted",
        status: "Counter Offer",
        createdAt: new Date()
      });

      await bid.save();
      return res.json({
        message: "Counter offer submitted successfully",
        bid
      });
    }

    /* PENDING */
    if (status === "Pending") {
      bid.status = "Pending";
      await bid.save();
      return res.json({
        message: "Bid moved to pending",
        bid
      });
    }

    return res.status(400).json({ message: "Invalid bid status" });
  } catch (error) {
    console.log("Update bid error:", error.message);
    res.status(500).json({ message: "Failed to update bid", error: error.message });
  }
});

/* =========================================================
   PROCESS DEMO PAYMENT
========================================================= */
router.put("/:id/pay", async (req, res) => {
  try {
    const { paymentMethod, accountHolder, bankAccount, ifsc, upiId } = req.body;

    const bid = await Bid.findById(req.params.id);
    if (!bid) {
      return res.status(404).json({ message: "Bid/Order not found" });
    }

    const produceAmt = Number(bid.quantity) * Number(bid.bidPrice);
    const transportFreight = 6500;
    const totalAmt = produceAmt + transportFreight;

    const dateStr = new Date().toISOString().replace(/[-:T.]/g, "").slice(0, 14);
    const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
    const txnId = `UZS-DEMO-${dateStr}-${randomHex}`;

    let masked = "";
    if (paymentMethod === "Bank Account" && bankAccount) {
      const cleanAcc = String(bankAccount).replace(/\s+/g, "");
      masked = "•••• " + cleanAcc.slice(-4);
    } else if (paymentMethod === "UPI" && upiId) {
      masked = String(upiId);
    }

    bid.isPaid = true;
    bid.paymentStatus = "Paid";
    bid.transactionId = txnId;
    bid.paymentMethod = paymentMethod || "Bank Account";
    bid.paymentDate = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
    bid.isDemoPayment = true;
    bid.produceAmount = produceAmt;
    bid.transportFreight = transportFreight;
    bid.totalAmount = totalAmt;
    bid.farmerSettlementStatus = "Released";
    bid.transporterSettlementStatus = "Released";
    bid.maskedAccount = masked;

    const savedBid = await bid.save();
    console.log(`💳 Demo Payment Processed for Order #${savedBid._id}: Txn ${txnId}, Total: ₹${totalAmt}`);

    res.json({
      message: "Demo Payment Successful",
      bid: savedBid,
      payment: {
        orderId: savedBid._id,
        transactionId: txnId,
        paymentMethod: savedBid.paymentMethod,
        produceAmount: produceAmt,
        transportFreight: transportFreight,
        totalAmount: totalAmt,
        paymentStatus: "Paid",
        isDemoPayment: true,
        paymentDate: savedBid.paymentDate,
        maskedAccount: masked,
        farmerSettlement: { amount: produceAmt, status: "Released" },
        transporterSettlement: { amount: transportFreight, status: "Released" }
      }
    });
  } catch (error) {
    console.log("Demo payment error:", error.message);
    res.status(500).json({ message: "Failed to process demo payment" });
  }
});

module.exports = router;
