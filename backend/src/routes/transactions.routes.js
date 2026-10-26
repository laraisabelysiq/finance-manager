
const express = require("express");
const authenticateToken = require("../middlewares/auth.middleware");
const transactionsController = require("../controllers/transactions.controller");

const router = express.Router();

router.use(authenticateToken);

router.get("/", transactionsController.list);
router.get("/:id", transactionsController.getById);
router.post("/", transactionsController.create);
router.put("/:id", transactionsController.update);
router.delete("/:id", transactionsController.remove);

module.exports = router;
