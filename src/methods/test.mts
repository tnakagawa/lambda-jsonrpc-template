import type { SimpleJSONRPCMethod } from "json-rpc-2.0";
import { JSONRPCErrorException, JSONRPCErrorCode } from "json-rpc-2.0";

export const test: SimpleJSONRPCMethod = async (params) => {
  if (params && params.message === "exception") {
    throw new JSONRPCErrorException("Internal error", JSONRPCErrorCode.InternalError, params);
  }
  return {
    result: true,
  };
};
