import { createClient } from "@libsql/client";
import dotenv from "dotenv";

dotenv.config();

const db = createClient({
  url: process.env.TURSO_DB_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export async function insertPlayerProfile(playerData) {
  try {
    console.log("Inserting player data:", playerData);

    // Check if member_id already exists
    const existingPlayer = await db.execute({
      sql: "SELECT member_id, player_name FROM player_profile WHERE member_id = ?",
      args: [playerData.member_id],
    });

    if (existingPlayer.rows.length > 0) {
      const existingName = existingPlayer.rows[0].player_name;
      console.log(
        `Player with member_id ${playerData.member_id} (${existingName}) already exists`
      );

      // Instead of updating, throw an error
      throw new Error(
        `Player "${existingName}" (ID: ${playerData.member_id}) already exists in the database. Please contact Shashank for resubmission of player information.`
      );
    } else {
      console.log(
        `Creating new player record with member_id ${playerData.member_id}`
      );

      // Insert a new record
      await db.execute({
        sql: `INSERT INTO player_profile (
                member_id,
                player_name,
                birth_date,
                nationality,
                role,
                batting_style,
                bowling_hand,
                bowling_style,
                debut_year,
                image_path
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          playerData.member_id,
          playerData.player_name,
          playerData.birth_date,
          playerData.nationality,
          playerData.role,
          playerData.batting_style,
          playerData.bowling_hand,
          playerData.bowling_style,
          playerData.debut_year,
          playerData.image_path,
        ],
      });

      return {
        success: true,
        message: "Player profile created successfully",
      };
    }
  } catch (error) {
    console.error("Database error:", error);
    throw error; // Re-throw to preserve the original error message
  }
}
