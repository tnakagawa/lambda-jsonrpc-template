import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import {
  JSONRPCServer,
  createJSONRPCErrorResponse,
  JSONRPCResponse,
  JSONRPCErrorCode,
  JSONRPCRequest,
} from "json-rpc-2.0";
import { Logger } from "@aws-lambda-powertools/logger";
import { echo } from "./methods/echo.mts";
import { test } from "./methods/test.mts";

const logger = new Logger();

// JSON-RPC サーバーのインスタンスを作成し、メソッドを登録
const server = new JSONRPCServer();
server.addMethod("echo", echo);
server.addMethod("test", test);

/**
 * Lambda Function URL の handler
 *
 * @param event - イベントオブジェクト
 * @returns レスポンスオブジェクト
 */
export const handler = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyStructuredResultV2> => {
  // HTTP メソッドが POST 以外の場合は 405 Method Not Allowed を返す
  if (event.requestContext.http.method !== "POST") {
    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: "Method Not Allowed",
    };
  }

  // 必要であれば認証チェックをここで行う

  // リクエストボディが存在しない場合はエラーを返す
  if (!event.body) {
    const response = createJSONRPCErrorResponse(
      null,
      JSONRPCErrorCode.InvalidRequest,
      "Invalid Request",
    );
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(response),
    };
  }

  // JSON-RPC リクエストのパース
  let payload: unknown;
  try {
    payload = JSON.parse(event.body);
  } catch (error) {
    // JSON パースエラーの場合は Parse Error を返す
    logger.warn("Failed to parse JSON body", { error });
    const response = createJSONRPCErrorResponse(null, JSONRPCErrorCode.ParseError, "Parse error");
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(response),
    };
  }

  // JSON-RPC リクエストの処理
  const jsonRpcResponse: JSONRPCResponse | JSONRPCResponse[] | null = await server.receive(
    payload as JSONRPCRequest | JSONRPCRequest[],
  );

  // JSON-RPC エラーが発生した場合は適切な HTTP ステータスコードを設定
  let responseStatusCode = 200;
  if (!Array.isArray(jsonRpcResponse)) {
    if (jsonRpcResponse?.error) {
      switch (jsonRpcResponse.error.code) {
        case JSONRPCErrorCode.InvalidRequest:
        case JSONRPCErrorCode.InvalidParams:
          responseStatusCode = 400;
          break;
        case JSONRPCErrorCode.MethodNotFound:
          responseStatusCode = 404;
          break;
        default:
          responseStatusCode = 500;
      }
    }
  }

  // レスポンスを返す
  return {
    statusCode: responseStatusCode,
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(jsonRpcResponse),
  };
};
