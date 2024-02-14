// url-shortener.test.js

import assert from "node:assert";
import path from "node:path";
import test from "node:test";

import { init, handler } from "./url-shortener.js";

test("url-shortener", async () => {
  await init();

  let response;

  const url = "http://example.com";

  response = await handler({
    requestContext: {
      http: {
        method: "POST",
      },
    },
    body: JSON.stringify({
      url,
    }),
  });

  assert.equal(response.statusCode, 200);

  console.log(response);

  response = await handler({
    rawPath: `/${JSON.parse(response.body)}`,
    requestContext: {
      http: {
        method: "GET",
      },
    },
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.headers.Location, url);

  console.log(response);
});

const AWS_FUNCTION_URL = process.env.AWS_FUNCTION_URL;

test("url-shortener lambda", async () => {
  const url = "http://example.com";

  let response;

  response = await fetch(AWS_FUNCTION_URL, {
    method: "POST",
    body: JSON.stringify({
      url,
    }),
  });

  assert.ok(response.ok);

  const id = await response.json();

  response = await fetch(path.join(AWS_FUNCTION_URL, id));

  assert.ok(response.ok);
  assert.equal(response.headers.get("location"), url);
});
