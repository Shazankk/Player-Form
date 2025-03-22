import { fetchPlayers } from "../src/api.js";
import { uploadImageToR2 } from "../src/r2.js";
import { insertPlayerProfile } from "../src/db.js";
import multipart from "@fastify/multipart";
import sharp from "sharp"; // You'll need to install this: npm install sharp

export default async function (fastify) {
  // Register multipart with increased limits
  await fastify.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit for original images
    },
  });

  // Register JSON body parser
  fastify.addContentTypeParser(
    "application/json",
    { parseAs: "string" },
    function (req, body, done) {
      try {
        const json = JSON.parse(body);
        done(null, json);
      } catch (err) {
        err.statusCode = 400;
        done(err, undefined);
      }
    }
  );

  // Player stats endpoint
  fastify.get("/api/v1/player-stats", async (request, reply) => {
    try {
      const players = await fetchPlayers();
      reply.send(players);
    } catch (error) {
      console.error("Error fetching players:", error);
      reply.status(500).send({ error: "Failed to fetch players" });
    }
  });

  // Image upload endpoint
  fastify.post("/api/v1/upload", async (request, reply) => {
    try {
      console.log("Received upload request");

      // Properly process multipart form data
      const parts = await request.parts();

      let fileBuffer = null;
      let fileInfo = null;
      let memberId = null;
      let playerName = null;

      // Process all parts of the multipart form
      for await (const part of parts) {
        console.log("Processing part:", part.fieldname, part.type);

        if (part.type === "file") {
          fileBuffer = await part.toBuffer();
          fileInfo = {
            filename: part.filename,
            mimetype: part.mimetype,
          };
        } else if (part.fieldname === "member_id") {
          memberId = part.value;
        } else if (part.fieldname === "player_name") {
          playerName = part.value;
        }
      }

      if (!fileBuffer) {
        console.error("No file found in request");
        return reply.status(400).send({ error: "No image uploaded" });
      }

      // Log extracted values
      console.log("Extracted member_id:", memberId);
      console.log("Extracted player_name:", playerName);
      console.log("File info:", fileInfo);

      // Determine player identifier
      let playerIdentifier = "unknown";
      if (memberId && memberId.trim() !== "") {
        playerIdentifier = memberId;
      } else if (playerName && playerName.trim() !== "") {
        playerIdentifier = playerName.replace(/[^a-z0-9]/gi, "_").toLowerCase();
      }

      console.log("Using player identifier:", playerIdentifier);

      // Create filename without timestamp
      const fileName = `player_${playerIdentifier}.avif`;
      const filePath = `players/${fileName}`;

      console.log("Final fileName:", fileName);

      // Convert to AVIF for smaller file size
      const originalSizeKB = fileBuffer.length / 1024;
      console.log(`Original file size: ${originalSizeKB.toFixed(2)} KB`);

      const avifBuffer = await sharp(fileBuffer)
        .resize(800) // Resize to a reasonable size
        .avif({ quality: 80 }) // AVIF format with 80% quality
        .toBuffer();

      const avifSizeKB = avifBuffer.length / 1024;
      console.log(`Converted AVIF size: ${avifSizeKB.toFixed(2)} KB`);
      console.log(
        `Compression ratio: ${((avifSizeKB / originalSizeKB) * 100).toFixed(
          2
        )}%`
      );

      // Upload to R2 - the uploadImageToR2 function now checks if the file exists
      const imageUrl = await uploadImageToR2(
        avifBuffer,
        filePath,
        "image/avif"
      );

      console.log("Upload successful, URL:", imageUrl);

      // Return success response
      reply.send({
        imageUrl,
        fileName,
        playerIdentifier,
      });
    } catch (error) {
      console.error("Image upload error:", error);

      // Check if this is the specific error for existing files
      if (
        error.message &&
        error.message.includes("already exists in R2 storage")
      ) {
        return reply.status(409).send({
          error: error.message,
        });
      }

      // Generic error for other issues
      reply.status(500).send({
        error: "Image upload failed: " + error.message,
      });
    }
  });

  // Submit player data endpoint - update to handle the specific error
  fastify.post("/api/v1/submit", async (request, reply) => {
    try {
      console.log("Received player data submission");
      console.log("Request headers:", request.headers);
      console.log("Raw request body:", request.body);

      // Parse the form data
      const formData = request.body;

      if (!formData) {
        console.error("No request body found");
        return reply.status(400).send({
          error: "No data received. Please try again.",
        });
      }

      // Convert string to object if needed
      if (typeof formData === "string") {
        try {
          formData = JSON.parse(formData);
        } catch (err) {
          console.error("Failed to parse JSON body:", err);
          return reply.status(400).send({
            error: "Invalid JSON format in request",
          });
        }
      }

      console.log("Processed form data:", formData);

      // Validate required fields
      const requiredFields = [
        "member_id",
        "player_name",
        "nationality",
        "role",
        "birth_date",
        "batting_style",
        "bowling_hand",
        "bowling_style",
        "debut_year",
        "image_path",
      ];

      const missingFields = requiredFields.filter((field) => !formData[field]);

      if (missingFields.length > 0) {
        console.error("Missing required fields:", missingFields);
        return reply.status(400).send({
          error: `Missing required fields: ${missingFields.join(", ")}`,
        });
      }

      // Format data for database
      const playerData = {
        member_id: parseInt(formData.member_id, 10),
        player_name: formData.player_name,
        birth_date: formData.birth_date,
        nationality: formData.nationality,
        role: formData.role,
        batting_style: formData.batting_style,
        bowling_hand: formData.bowling_hand,
        bowling_style: formData.bowling_style,
        debut_year: parseInt(formData.debut_year, 10),
        image_path: formData.image_path,
      };

      // Insert into database
      const result = await insertPlayerProfile(playerData);

      // Send success response
      reply.send({
        success: true,
        message: result.message || "Player profile saved successfully!",
        data: {
          member_id: playerData.member_id,
          player_name: playerData.player_name,
        },
      });
    } catch (error) {
      console.error("Player submission error:", error);

      // Check if this is the "player already exists" error
      if (
        error.message &&
        error.message.includes("already exists in the database")
      ) {
        // Send a 409 Conflict status with the specific error message
        return reply.status(409).send({
          error: error.message,
        });
      }

      // Generic server error for other issues
      reply.status(500).send({
        error: "Failed to save player data: " + error.message,
      });
    }
  });
}

// Helper function to get file extension
function getFileExtension(filename) {
  return filename.substring(filename.lastIndexOf(".")) || "";
}
