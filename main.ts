import { Transaction } from "@emurgo/cardano-serialization-lib-nodejs-gc";

export function main() {
  const cbor = Deno.args[0];
  if (!cbor) {
    console.error("Missing cbor argument.\n\nUsage: printx <cbor>");
    Deno.exit(1);
  }
  const tx = Transaction.from_hex(cbor);
  console.log(tx.to_json());
}

if (import.meta.main) {
  main();
}
