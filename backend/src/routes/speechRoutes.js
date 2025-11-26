const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer();

const { transcribeSpeech } = require("../controllers/speechController");

router.post("/speech", upload.single("audio"), transcribeSpeech);

module.exports = router;
