import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import worker from "../src/index.ts";
import { fakeEnv } from "./helpers.ts";

const sign = (body: string, secret = "secret") => createHmac("sha256", secret).update(body).digest("base64");
const ctx = { waitUntil: () => {}, passThroughOnException: () => {} } as unknown as ExecutionContext;
const post = (body: string, sig?: string) =>
  new Request("https://bot.example/webhook", { method: "POST", body, headers: sig ? { "x-line-signature": sig } : {} });

test("署名が正しいときだけ受け付ける", async () => {
  const { env } = fakeEnv();
  const body = JSON.stringify({ events: [] });
  assert.equal((await worker.fetch(post(body, sign(body)), env, ctx)).status, 200);
  assert.equal((await worker.fetch(post(body), env, ctx)).status, 401);
  assert.equal((await worker.fetch(post(body, sign(body, "wrong")), env, ctx)).status, 401);
  assert.equal((await worker.fetch(post(body + " ", sign(body)), env, ctx)).status, 401);
  assert.equal((await worker.fetch(post(body, "%%%not-base64"), env, ctx)).status, 401);
  assert.equal((await worker.fetch(new Request("https://bot.example/other", { method: "POST" }), env, ctx)).status, 404);
});
