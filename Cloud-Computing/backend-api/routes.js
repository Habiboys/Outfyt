const express = require("express");
const {
    auth,
    getCalendar,
    scrapeNews,
} = require("./controller.js");
const { start, send, stream } = require("./controller/chat.js");
const { verifyGoogleToken } = require("./auth.js");
const {uploadImage}= require("./controller/personalColor.js")
const multer = require("multer");
const router = express.Router();

const upload = multer({
    storage: multer.memoryStorage(),
});
router.get("/test", async (req, res) => {
    const respon = {
        message: "Server running successfully 25",
    };
    res.json(respon);
});

router.post("/auth", auth);
router.get("/calendar", verifyGoogleToken, getCalendar);
router.post(
    "/upload-image",
    upload.single("image"),
    uploadImage
);
router.get("/news", scrapeNews);
router.post("/chat/start", start);
router.post("/chat/send", send);
router.post("/chat/stream", stream);

module.exports = router;
