// url-shortener.js

import { createClient } from "@libsql/client";
import { nanoid } from "nanoid";

const TURSO_URL = process.env.TURSO_URL;
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN;

const client = createClient({
  url: TURSO_URL,
  authToken: TURSO_AUTH_TOKEN,
});

export const init = async () => {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS urls (
      id VARCHAR(6) PRIMARY KEY,
      url VARCHAR NOT NULL
    );
  `);
};

export const handler = async (event, context) => {
  switch (event.requestContext.http.method) {
    case "POST": {
      const body = JSON.parse(event.body);
      const id = nanoid(6);

      const result = await client.execute({
        sql: "INSERT INTO urls (id, url) VALUES (?, ?)",
        args: [id, body.url],
      });

      if (result.rowsAffected == 1) {
        return {
          statusCode: 200,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(id),
        };
      }

      break;
    }

    case "GET": {
      const id = event.rawPath.slice(1);

      const result = await client.execute({
        sql: "SELECT * FROM urls WHERE id = ?",
        args: [id],
      });

      if (result.rows.length > 0) {
        return {
          statusCode: 200,
          headers: {
            Location: result.rows.at(0).url,
          },
        };
      }

      break;
    }
  }

  return {
    statusCode: 500,
  };
};
