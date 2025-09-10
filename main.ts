import * as CSL from "@emurgo/cardano-serialization-lib-nodejs-gc";

async function getInput(): Promise<string | undefined> {
  try {
    if (Deno.args.length > 0 && !Deno.args[0].startsWith("-")) {
      return Deno.args[0];
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
    if (piped.length > 0) {
      return piped;
    }

    return undefined;
  } catch (error) {
    console.error(error);
    Deno.exit(1);
  }
}

const argDefs = [
  { short: "h", long: "help", description: "Print this help message" },
  { short: "c", long: "constructor", description: "Constructor name" },
  { short: "i", long: "input", description: "Input format" },
  { short: "o", long: "output", description: "Output format" },
] as const;

type Args = Record<typeof argDefs[number]["long"], string>;

const defaultArgs: Args = {
  help: "false",
  constructor: "Transaction",
  input: "hex",
  output: "json",
};

function getArgs(): Args {
  const args: Partial<Record<typeof argDefs[number]["long"], string>> = {};
  for (let i = 0; i < Deno.args.length; i++) {
    const arg = Deno.args[i];

    let argDef: typeof argDefs[number] | undefined = undefined;
    if (arg.startsWith("--")) {
      argDef = argDefs.find((a) => a.long === arg.slice(2));
    } else if (arg.startsWith("-")) {
      argDef = argDefs.find((a) => a.short === arg.slice(1, 2));
    }

    if (argDef) {
      const value = Deno.args[i + 1];
      if (i + 1 >= Deno.args.length || value.startsWith("-")) {
        args[argDef.long] = "true";
      } else {
        args[argDef.long] = value;
        i++;
      }
    }
  }
  return { ...defaultArgs, ...args };
}

type AnyConstructor = {
  [F in `from_${string}`]: (input: string) => {
    [T in `to_${string}`]: () => unknown;
  };
};

const helpMessage = `
Usage: printx [OPTIONS]

Options:
  ${
  argDefs.map((a) => `-${a.short}, --${a.long} ${a.description}`).join(
    "\n  ",
  )
}
`;

export async function main() {
  const args = getArgs();
  if (args.help !== "false") {
    console.error(helpMessage);
    Deno.exit(0);
  }

  const input = await getInput();
  if (!input) {
    console.error("No CBOR data provided");
    console.error(helpMessage);
    Deno.exit(1);
  }

  const cbor = input.replace(/"/g, "");

  const constructorName = args.constructor as keyof typeof CSL;
  const constructor = CSL[constructorName] as AnyConstructor;
  if (!constructor) {
    throw new Error(`Constructor ${constructorName} not found`);
  }

  const obj = constructor[`from_${args.input}`](cbor);

  const output = obj[`to_${args.output}`]();

  return output;
}

if (import.meta.main) {
  const res = await main();
  console.log(res);
  Deno.exit(0);
}
