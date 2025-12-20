const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");

// POST: Create a new order (called from payments.html form)
router.post("/create", orderController.createOrder);

module.exports = router;
