const express = require("express");
const router = express.Router();
const {
  signup,
  signin,
  getUserDetailsForAdmin,
  getUserProfile,
  verifyUser,
  getAllUsers,
  getAllAddresses,
  adminLogin,
  getAllUsersForAdmin,
  editUser
} = require("../controllers/authController");
const upload = require("../config/upload");

router.post(
  "/signup",
  upload.fields([
    { name: "profilePicture", maxCount: 1 },
    { name: "profileIdPicture", maxCount: 1 },
  ]),
  signup
);
router.post("/signin", signin);
router.get("/profile/:id", getUserProfile);
router.get("/admin/user/:id", getUserDetailsForAdmin);
router.patch("/verify/:id", verifyUser);
router.get("/users", getAllUsers);
router.get("/admin/users", getAllUsersForAdmin);
router.get("/addresses", getAllAddresses);
router.post('/admin/login', adminLogin);
router.patch("/users/:userId", upload.fields([
  { name: "profilePicture", maxCount: 1 }
]), editUser);

module.exports = router;
