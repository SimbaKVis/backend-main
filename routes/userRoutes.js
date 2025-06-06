const express = require("express");
const router = express.Router();
const UserController = require("../controllers/userController");

// User routes
router.get("/", UserController.getUsers);
router.post("/", UserController.createUser);
router.put("/:userid", UserController.updateUser);
router.delete("/:userid", UserController.deleteUser);
router.put('/:userid/update-password', (req, res) => {
    res.json({ message: "Route is working!" });
  });
module.exports = router;