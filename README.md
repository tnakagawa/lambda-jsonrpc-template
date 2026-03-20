# lambda-jsonrpc-template


**TypeScript (Node 24) + AWS Lambda Function URL + JSON‑RPC 2.0 のテンプレート**

AWS Lambda Function URL 上で JSON‑RPC 2.0 API を構築するための、 **TypeScript テンプレート**です。

- Node.js 24（ESM / NodeNext）
- JSON‑RPC 2.0 準拠
- esbuild による高速バンドル
- 単一ファイル ZIP 作成
- Vitest
- Lambda Function URL に最適化されたハンドラー構成

「API Gateway を使わずに JSON‑RPC API を作りたい」  
「最小構成で Lambda を運用したい」  
そんな開発者のためのテンプレートです。


## 特徴

### JSON‑RPC 2.0 に全準拠
`json-rpc-2.0` ライブラリを使用し、  
- メソッド登録  
- バッチリクエスト  
- エラーコード（-32600, -32601, -32602, -32603, -32700）  
を正しく処理します。

### AWS Lambda Function URL に最適化

API Gateway を使わず、 **Lambda 単体で JSON‑RPC API を公開**できます。

### Node 24 + TypeScript + ESM
- `.mts` による ESM  
- NodeNext モジュール解決  
- allowImportingTsExtensions 対応  
- esbuild バンドルで高速デプロイ

### Vitest によるテスト
Lambda handler の挙動を網羅したテストを同梱。

### 単一ファイル ZIP デプロイ

Lambda に最適な  **dist/index.mjs + node_modules の最小 ZIP** を生成。


## ディレクトリ構成

```
.
├── src/
│   ├── index.mts        # Lambda handler
│   └── methods/
│       ├── echo.mts     # JSON-RPC method: echo
│       └── test.mts     # JSON-RPC method: test
├── test/
│   └── index.test.ts    # Vitest テスト
├── scripts/
│   ├── build.mts        # ビルド スクリプト
│   └── zip.mts          # ZIP 作成スクリプト
├── tsconfig.json
├── package.json
└── README.md
```

## セットアップ

```bash
npm install
```

## 開発

### テスト実行

```bash
npm test
```

## ビルド

```bash
npm run build
```

出力は `dist/index.mjs` に生成されます。

## ZIP 作成

```bash
npm run zip
```

`dist/lambda.zip` が生成されます。

## JSON‑RPC メソッドの追加方法

`src/methods/` にメソッドを追加し、`index.mts` に登録します。

### 例：`hello` メソッドを追加

**`src/methods/hello.mts`** 追加

```ts
import type { SimpleJSONRPCMethod } from "json-rpc-2.0";

export const hello: SimpleJSONRPCMethod = async (params) => {
  return {
    message: "Hello",
  };
};
```

**`src/index.mts`** 追記

```ts
import { hello } from "./methods/hello.mts";

server.addMethod("hello", hello);
```


## ライセンス

MIT License

# References

- https://www.jsonrpc.org/specification