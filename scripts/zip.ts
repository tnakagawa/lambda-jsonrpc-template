import { archiveFile } from "zip-lib";

await archiveFile("dist/index.mjs", "dist/lambda.zip");
console.log("Created lambda.zip successfully");
