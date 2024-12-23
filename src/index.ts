import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { Hono } from "hono";
import { products, users } from "./db/schema";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

export type Env = {
  DATABASE_URL: string;
};

const app = new Hono<{ Bindings: Env }>();

// Helper function to generate random price between min and max
const getRandomPrice = (min: number, max: number): number => {
  return Number((Math.random() * (max - min) + min).toFixed(2));
};

app
  .get("/", async (c) => {
    try {
      const client = new Pool({ connectionString: c.env.DATABASE_URL });
      const db = drizzle(client);
      const result = await db.select().from(users);
      return c.json({
        result,
      });
    } catch (error) {
      console.log(error);
      return c.json({
        error,
      });
    }
  })
  .get("/users", async (c) => {
    try {
      // Generate dummy price data that Switchboard can parse
      const dummyPrice = getRandomPrice(100, 1000);

      // Return in a format that Switchboard can parse
      return c.json({
        value: dummyPrice,
      });

      // Alternatively, if you need both the user data and the value:
      /*
      return c.json({
        value: dummyPrice,
        metadata: {
          username: "test",
          timestamp: Date.now()
        }
      });
      */
    } catch (error) {
      console.log(error);
      return c.json({
        error: "Failed to fetch data",
        value: 0, // Fallback value for Switchboard
      });
    }
  })
  .post(
    "/users",
    zValidator("json", z.object({ username: z.string() })),
    async (c) => {
      try {
        const { username } = c.req.valid("json");
        const client = new Pool({ connectionString: c.env.DATABASE_URL });
        const db = drizzle(client);
        await db.insert(users).values({ username });
        return c.json({
          status: 200,
          message: "SUCCESS",
        });
      } catch (error) {
        console.log(error);
        return c.json({
          status: 400,
          message: "FAILED",
        });
      }
    }
  );

export default app;
