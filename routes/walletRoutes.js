const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const walletController = require("../controllers/walletController");

// Wallet APIs
router.get("/balance", auth, walletController.getBalance);
router.post("/add", auth, walletController.addMoney);
router.post("/withdraw", auth, walletController.withdrawMoney);

module.exports = router;
