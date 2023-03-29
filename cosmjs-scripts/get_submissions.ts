import { CosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { assert, sleep } from "@cosmjs/utils";

declare const process: any; // using Node.js, so we have this

const rpcEndpoint: string = process.env.RPC_ENDPOINT;
assert(rpcEndpoint, "RPC_ENDPOINT not set");

const client = await CosmWasmClient.connect(rpcEndpoint);

const drandAddress =
  "nois19w26q6n44xqepduudfz2xls4pc5lltpn6rxu34g0jshxu3rdujzsj7dgu8";
const lastAffected = 809960;

let startAfter: number | null = null;

let rounds: number[] = [];

while (true) {
  console.log("Query beacons after", startAfter);
  const { beacons } = await client.queryContractSmart(drandAddress, {
    beacons_asc: { start_after: startAfter, limit: 180 },
  });
  rounds.push(...beacons.map((b) => b.round));
  let max = Math.max(...rounds);
  if (max >= lastAffected) {
    break;
  } else {
    startAfter = max;
  }
}

rounds = rounds.filter((r) => r <= lastAffected);

console.log("Rounds affected:", rounds.length);
console.log("Min:", Math.min(...rounds));
console.log("Max:", Math.max(...rounds));

export interface Submission {
  /** Address of the bot */
  readonly bot: string;
  readonly time: string;
  readonly height: number;
  readonly tx_index: number | null;
}

const counts = new Map<string, number>();
for (const r of rounds) {
  const response: { submissions: ReadonlyArray<Submission> } =
    await client.queryContractSmart(drandAddress, {
      submissions: { round: r },
    });

  for (const { bot } of response.submissions) {
    const old = counts.get(bot) || 0;
    counts.set(bot, old + 1);
  }

  // console.log(response.submissions.map(sub => sub.bot));
}

for (const [bot, count] of counts.entries()) {
  console.log(bot, count);
}
