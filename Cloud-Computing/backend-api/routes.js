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
        message: "Awesome, Server running successfully",
    };
    res.json(respon);
});


router.post("/auth", auth);
router.get("/calendar", verifyGoogleToken, getCalendar);
router.post(
    "/upload-image",
    verifyGoogleToken,
    upload.single("image"),
    uploadImage
);
router.post(
    "/upload-image-test",
    upload.single("image"),
    uploadImage
);
router.get("/news",verifyGoogleToken, scrapeNews);
router.post("/chat/start",verifyGoogleToken, start);
router.post("/chat/send",verifyGoogleToken, send);
router.post("/chat/stream",verifyGoogleToken, stream);

module.exports = router;
