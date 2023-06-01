/*
 * @types/node is missing BinaryToTextEncoding for the crypto module.
 * Required by node_modules/builder-util-runtime/out/httpExecutor.d.ts
 */

declare module "crypto" {
  export type BinaryToTextEncoding = "base64" | "base64url" | "hex" | "binary";
}
