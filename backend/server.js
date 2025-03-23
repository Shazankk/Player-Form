import Fastify from "fastify";
import cors from "@fastify/cors";
import routes from "./routes/routes.js";
import dotenv from "dotenv";

dotenv.config();

const fastify = Fastify({
  logger: true,
});

// Enable CORS for frontend requests
await fastify.register(cors, {
  origin: true, // Allow any origin in development
});

// Register routes
await fastify.register(routes);

// Start server
try {
  await fastify.listen({ port: 8080, host: "0.0.0.0" });
  console.log(`Server listening on ${fastify.server.address().port}`);
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
