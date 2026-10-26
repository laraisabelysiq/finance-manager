
const express = require("express");
const authenticateToken = require("../middlewares/auth.middleware");
const categoriesController = require("../controllers/categories.controller");

const router = express.Router();

router.use(authenticateToken);

router.get("/", categoriesController.list);
router.get("/:id", categoriesController.getById);
router.post("/", categoriesController.create);
router.put("/:id", categoriesController.update);
router.delete("/:id", categoriesController.remove);

module.exports = router;
