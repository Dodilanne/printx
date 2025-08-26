import { Transaction } from "@emurgo/cardano-serialization-lib-nodejs-gc";

async function getInput(): Promise<string | undefined> {
  try {
    const arg = Deno.args[0];
    if (arg?.length) {
      return arg;
    }

    if (Deno.stdin.isTerminal()) {
      return undefined;
    }

    const decoder = new TextDecoder();
    const buffer = new Uint8Array(4096);
    let input = "";

    while (true) {
      const n = await Deno.stdin.read(buffer);
      if (n === null) break;
      input += decoder.decode(buffer.subarray(0, n));
    }

    const piped = input.trim();
    return piped.length > 0 ? piped : undefined;
  } catch (error) {
    console.error(error);
    Deno.exit(1);
  }
}

export async function main() {
  const cbor = await getInput();
  if (!cbor) {
    console.error("No CBOR data provided");
    Deno.exit(1);
  }
  const tx = Transaction.from_hex(cbor);
  console.log(tx.to_json());
}

if (import.meta.main) {
  await main();
}
