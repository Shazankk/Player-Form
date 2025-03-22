import dotenv from "dotenv";
import { fileURLToPath } from "url";

// Load environment variables; adjust the path if you use a different env file (such as .env.development)
dotenv.config({ path: new URL("../.env", import.meta.url).pathname });

// Now import fetchPlayers from your api module – thanks to the module alias "$env/static/private" is resolved.
import { fetchPlayers } from "../src/api.js";

async function testApi() {
  try {
    const players = await fetchPlayers();
    console.log("Players fetched successfully:");
    console.log(players);
  } catch (error) {
    console.error("Error fetching players:", error);
  }
}

testApi();
