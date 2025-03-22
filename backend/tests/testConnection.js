import { uploadImageToR2 } from "../src/r2.js";
import fs from "fs/promises";
import path from "path";

async function testR2Connection() {
  try {
    // Create a test buffer (1x1 pixel JPEG)
    const testImage = await fs.readFile(
      path.join(process.cwd(), "test-image.png")
    );

    // Test upload
    const fileName = `test-${Date.now()}.jpg`;
    const imageUrl = await uploadImageToR2(testImage, fileName);

    console.log("✅ R2 Connection Test Successful!");
    console.log("Uploaded Image URL:", imageUrl);
    return true;
  } catch (error) {
    console.error("❌ R2 Connection Test Failed:", error.message);
    return false;
  }
}

// Run the test
testR2Connection();
