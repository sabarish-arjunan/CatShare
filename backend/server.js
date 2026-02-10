const express = require("express");
const multer = require("multer");
const fetch = require("node-fetch");
const cors = require("cors");
require("dotenv").config();

const app = express();
const upload = multer();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.post("/remove-bg", upload.single("image_file"), async (req, res) => {
  try {
    const formData = new FormData();
    formData.append("image_file", req.file.buffer, {
      filename: "image.png",
    });
    formData.append("crop", "true"); // optional
    formData.append("bg_color", "none"); // or white like "#ffffff"

    const result = await fetch("https://sdk.photoroom.com/v1/segment", {
      method: "POST",
      headers: {
        "x-api-key": process.env.PHOTOROOM_API_KEY,
      },
      body: formData,
    });

    if (!result.ok) {
      const errorText = await result.text();
      return res.status(result.status).send(errorText);
    }

    const arrayBuffer = await result.arrayBuffer();
    res.set("Content-Type", "image/png");
    res.send(Buffer.from(arrayBuffer));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "PhotoRoom API failed" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Proxy running at http://localhost:${PORT}`);
});
