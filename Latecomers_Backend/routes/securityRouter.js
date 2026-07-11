

const express = require("express");
const router = express.Router();
const securityController = require("../controller/securityController");

router.get("/get-security-data", securityController.SecurityData);

module.exports = router;
