import dotenv from "dotenv";
dotenv.config({ path: new URL("../.env", import.meta.url).pathname });

const PLAY_CRICKET_API_TOKEN = process.env.PLAY_CRICKET_API_TOKEN;
const PLAY_CRICKET_SITE_ID = process.env.PLAY_CRICKET_SITE_ID;
const PLAY_CRICKET_INCLUDE_EVERYONE = process.env.PLAY_CRICKET_INCLUDE_EVERYONE;
const PLAY_CRICKET_INCLUDE_HISTORIC = process.env.PLAY_CRICKET_INCLUDE_HISTORIC;

export async function fetchPlayers() {
  try {
    const apiToken = PLAY_CRICKET_API_TOKEN;
    const siteId = PLAY_CRICKET_SITE_ID;
    const includeEveryone =
      PLAY_CRICKET_INCLUDE_EVERYONE === "yes" ? "yes" : "no";
    const includeHistoric =
      PLAY_CRICKET_INCLUDE_HISTORIC === "yes" ? "yes" : "no";

    const apiUrl = `http://play-cricket.com/api/v2/sites/${siteId}/players`;
    const params = new URLSearchParams({
      api_token: apiToken,
      include_everyone: includeEveryone,
      include_historic: includeHistoric,
    });

    const response = await fetch(`${apiUrl}?${params}`);
    if (!response.ok) {
      throw new Error(`API request failed with status: ${response.status}`);
    }

    const data = await response.json();
    return data.players || [];
  } catch (err) {
    console.error("Error fetching players:", err);
    throw new Error("Failed to fetch players", { cause: err });
  }
}
