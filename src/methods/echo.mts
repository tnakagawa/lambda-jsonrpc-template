import type { SimpleJSONRPCMethod } from "json-rpc-2.0";

export const echo: SimpleJSONRPCMethod = async (params) => {
  return {
    echo: params,
  };
};
