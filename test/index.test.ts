import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { describe, it, expect } from "vitest";
import { handler } from "../src/index.mts";

const baseEvent: APIGatewayProxyEventV2 = {
  version: "2.0",
  routeKey: "POST /",
  rawPath: "/",
  rawQueryString: "",
  headers: {
    "content-type": "application/json",
  },
  requestContext: {
    accountId: "123456789012",
    apiId: "test-api",
    domainName: "test.example.com",
    domainPrefix: "test",
    http: {
      method: "POST",
      path: "/",
      protocol: "HTTP/1.1",
      sourceIp: "127.0.0.1",
      userAgent: "vitest",
    },
    requestId: "test-request-id",
    routeKey: "POST /",
    stage: "$default",
    time: "01/Jan/2025:00:00:00 +0000",
    timeEpoch: 1700000000000,
  },
  isBase64Encoded: false,
};

describe("Lambda Function URL JSON-RPC handler", () => {
  it("returns valid JSON-RPC response for echo method", async () => {
    const event = {
      ...baseEvent,
      body: JSON.stringify({ jsonrpc: "2.0", method: "echo", params: { foo: "bar" }, id: 1 }),
    } as APIGatewayProxyEventV2;

    const resp = await handler(event);

    expect(resp.statusCode).toBe(200);
    expect(resp.body).toBeTruthy();

    const parsed = JSON.parse(resp.body as string);
    expect(parsed).toStrictEqual({
      jsonrpc: "2.0",
      id: 1,
      result: { echo: { foo: "bar" } },
    });
  });

  it("returns valid JSON-RPC response for test method", async () => {
    const event = {
      ...baseEvent,
      body: JSON.stringify({ jsonrpc: "2.0", method: "test", params: null, id: 1 }),
    } as APIGatewayProxyEventV2;

    const resp = await handler(event);

    expect(resp.statusCode).toBe(200);
    expect(resp.body).toBeTruthy();

    const parsed = JSON.parse(resp.body as string);
    expect(parsed).toStrictEqual({
      jsonrpc: "2.0",
      id: 1,
      result: {
        result: true,
      },
    });
  });

  it("returns correct JSON-RPC responses for batch requests", async () => {
    const event = {
      ...baseEvent,
      body: JSON.stringify([
        { jsonrpc: "2.0", method: "echo", params: { foo: "bar" }, id: 1 },
        { jsonrpc: "2.0", method: "test", params: null, id: 2 },
      ]),
    } as APIGatewayProxyEventV2;

    const resp = await handler(event);

    expect(resp.statusCode).toBe(200);
    expect(resp.body).toBeTruthy();

    const parsed = JSON.parse(resp.body as string);
    expect(parsed).toStrictEqual([
      {
        jsonrpc: "2.0",
        id: 1,
        result: { echo: { foo: "bar" } },
      },
      {
        jsonrpc: "2.0",
        id: 2,
        result: {
          result: true,
        },
      },
    ]);
  });

  it("returns Method not found error (-32601) for unknown method", async () => {
    const id = Math.floor(Math.random() * 1000);
    const event = {
      ...baseEvent,
      body: JSON.stringify({ jsonrpc: "2.0", method: "unknown", params: { foo: "bar" }, id: id }),
    } as APIGatewayProxyEventV2;

    const resp = await handler(event);

    expect(resp.statusCode).toBe(404);
    expect(resp.body).toBeTruthy();

    const parsed = JSON.parse(resp.body as string);
    expect(parsed).toStrictEqual({
      jsonrpc: "2.0",
      id: id,
      error: {
        code: -32601,
        message: "Method not found",
      },
    });
  });

  it("returns 405 Method Not Allowed for non-POST requests", async () => {
    const event = {
      ...baseEvent,
      requestContext: {
        ...baseEvent.requestContext,
        http: { ...baseEvent.requestContext.http, method: "GET" },
      },
    } as APIGatewayProxyEventV2;
    const resp = await handler(event);

    expect(resp.statusCode).toBe(405);
    expect(resp.body).toBe("Method Not Allowed");
  });

  it("returns 400 Parse Error for invalid JSON", async () => {
    const event = { ...baseEvent, body: "{ invalid json" } as APIGatewayProxyEventV2;
    const resp = await handler(event);

    expect(resp.statusCode).toBe(400);
    const parsed = JSON.parse(resp.body as string);
    expect(parsed).toMatchObject({
      jsonrpc: "2.0",
      id: null,
      error: {
        code: -32700,
        message: "Parse error",
      },
    });
  });

  it("returns JSON-RPC Parse error (-32700) for invalid JSON", async () => {
    const event = { ...baseEvent, body: "{ invalid json" } as APIGatewayProxyEventV2;
    const resp = await handler(event);

    expect(resp.statusCode).toBe(400);
    const parsed = JSON.parse(resp.body as string);
    expect(parsed).toStrictEqual({
      jsonrpc: "2.0",
      id: null,
      error: {
        code: -32700,
        message: "Parse error",
      },
    });
  });

  it("returns JSON-RPC Invalid Request (-32600) when body is omitted", async () => {
    const event = { ...baseEvent, body: undefined } as APIGatewayProxyEventV2;
    const resp = await handler(event);

    expect(resp.statusCode).toBe(400);
    const parsed = JSON.parse(resp.body as string);
    expect(parsed).toStrictEqual({
      jsonrpc: "2.0",
      id: null,
      error: {
        code: -32600,
        message: "Invalid Request",
      },
    });
  });

  it("returns JSON-RPC Invalid Request (-32600) when jsonrpc field is missing", async () => {
    const event = {
      ...baseEvent,
      body: JSON.stringify({ method: "test", params: null, id: 1 }),
    } as APIGatewayProxyEventV2;

    const resp = await handler(event);

    expect(resp.statusCode).toBe(400);
    expect(resp.body).toBeTruthy();

    const parsed = JSON.parse(resp.body as string);
    expect(parsed).toStrictEqual({
      jsonrpc: "2.0",
      id: 1,
      error: {
        code: -32600,
        message: "Invalid Request",
      },
    });
  });

  it("returns JSON-RPC Invalid Request (-32600) for invalid items in batch request", async () => {
    const event = {
      ...baseEvent,
      body: JSON.stringify([
        { jsonrpc: "2.0", method: "echo", params: { foo: "bar" }, id: 1 },
        { method: "test", params: null, id: 2 },
      ]),
    } as APIGatewayProxyEventV2;

    const resp = await handler(event);

    expect(resp.statusCode).toBe(200);
    expect(resp.body).toBeTruthy();

    const parsed = JSON.parse(resp.body as string);
    expect(parsed).toStrictEqual([
      {
        jsonrpc: "2.0",
        id: 1,
        result: { echo: { foo: "bar" } },
      },
      {
        jsonrpc: "2.0",
        id: 2,
        error: {
          code: -32600,
          message: "Invalid Request",
        },
      },
    ]);
  });

  it("returns JSON-RPC Internal error (-32603) when method throws exception", async () => {
    const event = {
      ...baseEvent,
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "test",
        params: { message: "exception" },
        id: 1,
      }),
    } as APIGatewayProxyEventV2;

    const resp = await handler(event);

    expect(resp.statusCode).toBe(500);
    expect(resp.body).toBeTruthy();

    const parsed = JSON.parse(resp.body as string);
    expect(parsed).toStrictEqual({
      jsonrpc: "2.0",
      id: 1,
      error: {
        code: -32603,
        message: "Internal error",
        data: { message: "exception" },
      },
    });
  });
});
