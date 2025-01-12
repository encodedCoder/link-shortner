import { Request, Response } from "express";
import UrlModel from "../models/urlModel";
import { generateShortCode, isValidUrl } from "../utils";
import { config } from "../config";

export async function createShortUrl(
  req: Request,
  res: Response
): Promise<void> {
  console.log("Received request to /shorten");
  console.log("Request body:", req.body);

  const { originalUrl } = req.body;
  if (!originalUrl) {
    console.error("Error: originalUrl is required");
    res.status(400).json({ message: "originalUrl is required" });
    return;
  }

  if (!isValidUrl(originalUrl)) {
    console.error("Error: Invalid URL format");
    res.status(400).json({ message: "Invalid URL format" });
    return;
  }

  const shortCode = generateShortCode();
  console.log("Generated short code:", shortCode);
  const hostname = req.hostname;
  const url = new UrlModel({ originalUrl, shortCode, hostname });

  try {
    await url.save();

    let baseUrl: string;
    baseUrl = "https://clipp.vercel.app";
    console.log("Hostname:", hostname);

    if (hostname === "localhost") {
      baseUrl = `http://localhost:${config.port}`;
    } else if (hostname === "clipp.vercel.app") {
      baseUrl = "https://clipp.vercel.app";
    } else if (hostname === "clipp.work") {
      baseUrl = "https://clipp.work";
    } else if (hostname === "link-shortner-k5b9.onrender.com") {
      baseUrl = "https://link-shortner-k5b9.onrender.com";
    } else {
      baseUrl = `http://${hostname}`; // Fallback URL
    }

    const shortenedUrl = `${baseUrl}/${shortCode}`;
    console.log("Shortened URL:", shortenedUrl);

    res.json({
      shortenedUrl: shortenedUrl,
    });
  } catch (error) {
    console.error("Error saving URL:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function redirectUrl(req: Request, res: Response): Promise<void> {
  const { shortCode } = req.params;

  try {
    const url = await UrlModel.findOne({ shortCode });
    if (!url) {
      res.status(404).send("Invalid link");
      return;
    }

    res.redirect(url.originalUrl);
  } catch (error) {
    console.error("Error redirecting URL:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
