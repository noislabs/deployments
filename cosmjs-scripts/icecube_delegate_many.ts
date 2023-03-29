import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { GasPrice } from "@cosmjs/stargate";
import {
  ExecuteInstruction,
  SigningCosmWasmClient,
} from "@cosmjs/cosmwasm-stargate";
import { assert, sleep } from "@cosmjs/utils";

await sleep(500); // wait until prompt is printed

export interface IcecubeExecuteMsg {
  readonly delegate?: {
    readonly addr: string;
    readonly amount: string;
  };
  readonly undelegate?: {
    readonly addr: string;
    readonly amount: string;
  };
  readonly redelegate?: {
    readonly src_addr: string;
    readonly dest_addr: string;
    readonly amount: string;
  };
  // ... some more options, see contract
}

declare const process: any; // using Node.js, so we have this

const mnemonic: string = process.env.MNEMONIC;
assert(mnemonic, "MNEMONIC not set");
const rpcEndpoint: string = process.env.RPC_ENDPOINT;
assert(rpcEndpoint, "RPC_ENDPOINT not set");

// See https://docs2.nois.network/mainnet.html
// https://nois.explorers.guru/account/nois1gwnfyx82rwgc4y9r8vx6nr9v35dwezw3dadw6h39mad9amg7shnsler5f0
const icecubeAddress =
  "nois1gwnfyx82rwgc4y9r8vx6nr9v35dwezw3dadw6h39mad9amg7shnsler5f0";

const amount = 100_000; // NOIS

const gasPrice = GasPrice.fromString("0.05unois");
const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
  prefix: "nois",
});
const [account] = await wallet.getAccounts();
console.log("Wallet address:", account.address);
const client = await SigningCosmWasmClient.connectWithSigner(
  rpcEndpoint,
  wallet,
  { gasPrice }
);

// validator addresses
const recipients = `
noisvaloper17quau8ah8zdadkyflz0h6ead27n2yjj9wv8yxa
noisvaloper1pm7zfz2z80wyl5clt3dhjduwc93gw7yhs3ljha
noisvaloper15kzwgak8upfc498ve80u9zjcd459dj385ngmgh
noisvaloper1au4axasl3agzl9smd9zhqlx5hpg2ezdy873tp9
noisvaloper1088zdc7lxqvh7mwyv46cr6s3asydvwe2ndcqx6
noisvaloper1j7fgj7v9nqjg6wfda9paldcxezd8yv4qwtj4ax
noisvaloper1xwazl8ftks4gn00y5x3c47auquc62ssu4rf3nu
noisvaloper1tej5lqkljmnd8mszhkg0aepn5qaltyekew5ces
noisvaloper104hetrwd96sgj9tjdwpf6wkwflxtmq7na7tuq3
noisvaloper10hmy2yhwhqqe8p7ax0hrdt4uxkumlhcf7tkkk2
noisvaloper1vj6ydcqycrxe8lnn8z75pdy52gvr0nzuk9nc29
noisvaloper10wxn2lv29yqnw2uf4jf439kwy5ef00qdqcn7h2
noisvaloper1z8jthusnem2h2qfa43gzv2eqv3zqmwf633cswz
noisvaloper1ua2qf3vfu5v4f547ndvze0jptm3zxl8r0td7kz
noisvaloper1uwvvx04c99pakexg0ydgqkr2e6f0fcsm47q96l

noisvaloper1zhqh6mv5qf0jad25ethrgsljmfmwwrajvykp5y
noisvaloper1g9u6lynujx5r4cn74y0hkknjqkx72s6tap0znh
noisvaloper1cd3d6zh2yp0me78r4kwhfyvg6psm5y569m6tpx
noisvaloper1em0rgk80hmvel9vlaqthrvu9avfp0kgwujjsun
noisvaloper1mmvlk84t25p3n7vn6d8w2jkt5lqet52vqk886c
noisvaloper1qzpl6zv2n8w4nqszrqsnxa8jzys8u9qxuh0m8j
noisvaloper1u4v6aw9vpzvmcwux9mygc2fkgs64g27ghucctp
noisvaloper198un95fs7wxqkv53zhc8hjcyga8qgswtv82x9w
noisvaloper1wsrjxq4tnt5sxj6p8v524zj4nf0d776ytr3em3
noisvaloper1tqgttulhzgeu6esp69tux50d3xp6dfxaa7kfry
noisvaloper1ysszgcfrl8tnq3yu4pd6dkzzs0awljqnnd5pe4

noisvaloper19yul78yu9jzay9afsyjgmv0pk0k5rl80sa6vlx
noisvaloper1knljz5pa3uyh7n83e54p6x4u0g3crdjl8qy550
noisvaloper16af5x850nre0qu8gprux3qhfnaq4k7s7ju4j0g
noisvaloper1fe7ju873fkknmfrmytaft93y5rlf0xcrqtp39k
noisvaloper140l6y2gp3gxvay6qtn70re7z2s0gn57zu3u0nd
noisvaloper1j56lgzgtjpc6mnp2q73tat58da52j6nwjazfkd
noisvaloper1derp7w6q5pg37j9nuv42fzv7zsdu58evthwxv6
noisvaloper1qjftpa8wuyt2zpe6ll5qu23f6xxjpvk7gffppd
noisvaloper1hlpj3lw7d2shtxqtjwn0y78vq903e48aqy58un
noisvaloper1m75ljwympv4dys9z57nkzlk0x9ww9h72nh6kp0
noisvaloper1pq6spkms6p42djr9tsfqmlnngaf7aht8288u2k
noisvaloper19f0w9svr905fhefusyx4z8sf83j6et0gsr06wq
noisvaloper1k4epy263g5wuzeu92396lmq8y62jxgcelv3hc0
noisvaloper1xmvq9x8mttehk6602smz3zdlcymgxscl8502d8
noisvaloper1uz533k43tuhkwhpgv5g7jev8dyts0q9wu45jvn
noisvaloper1enwhnv85g4n99a2kzg8gey22xu6u43l4cxj824
noisvaloper12r4sun4wmqd9vrj039nalup0aj02efpfd3zphz
noisvaloper1jcqxnmtu7d9dl2llty3wsfrky52dffrkzgwl43
noisvaloper1pk9gxn40gxadjassmtpnpl0zdc2wgxhd62vwhh
noisvaloper155a3dkeqmzjwdfp08wp7yzwvu404l2mteyl4sl
noisvaloper1xt47alla8xrwy4e2r4gv0uey4q9uf2j8a0jghl
noisvaloper1j2p6k6dz8hq0wdusvd0kpm45v259uk8c4vv4wd
noisvaloper1zdc69y6vhmsmgne4vn0fkh2nurtfjk5e5uuhuu
noisvaloper1r4dnm99wuv93utu07astefy9n75wa6x52hg9k6
noisvaloper14fewxgk259tndya35f9t6q9awxd6xckzvudn4g
noisvaloper1unp92t4unmmpusjqs45fgx9f5ysyt4epu8ppfz
noisvaloper14de6yy0g7kp5z9w7tg8wsnp8yg6vzxy4dmacat
noisvaloper1xxwqq6hgg5e5sd786fmecq0mpxqd7y9q04vz0d

noisvaloper1uklqslvu2dht3jp63np5mqsqu73ckpa48s5wjs
noisvaloper1gv0d8lyttmtnl2pe64m382p84c98te50p0zgsy
noisvaloper1qrnl66kmaf276wd0fj2fp6cnnj9gta5zz8muv8
noisvaloper1v609zcn05sdkhe5z4u7laugvdqah6326pa3qv0
noisvaloper1kmf9w8nmvsuaps2kf4smhphnj8unjcak3hczyr
noisvaloper1fnfwprtjc6x4tk5u4fsnglr6e4n5fs9w27f6pk
noisvaloper1ljvdlhws6j5md5srpy7jdrxpuhpx2k7w98ad7u
noisvaloper1llkf6x237xadn7sqlscqgpg4e79xcwl4h73j6m
noisvaloper1cxymlc09tnlnel4etwegphqu08tylqj5dvu8tc
noisvaloper10hcnj06d32khtknfgxkcs05amnw4wrl802re70
noisvaloper1qlq3c2pjjha03h7eg4p462m7agum57f59rdrv3
noisvaloper18r09wuucu8qhejt7ujsl2gh7704c65r8ceyywc
noisvaloper1vujfft38ggemn4jzxv2z427yl950396jcq5556
noisvaloper1n3rae5ctxq0lxgc2dd6sfu653xg0jmre4sguzt
noisvaloper1jjwhgtf7a60y27slquc52z2efnhlu0wd36zgk0
noisvaloper1z8nny6dyww8pgul3rcq4ctjq8j0sm24rh3dv5w
noisvaloper1hwg54kyrl5p8p3h26h8z56k07arzh6mraxfu8u
noisvaloper15kywkhdljlkfvvzwkshnquz2x63nrxewteqygf
noisvaloper120c0gc9uhtg74rseeu0p5f5mu8vefpzft5kg2m
noisvaloper1er34zm90nlm3xmhwx2zpt4gnzd4htmj2na0w5z
noisvaloper1g8rqhyk6ghk5q3qadd6h7vc7vcf5j5jjpf0v9n
noisvaloper1gjtvly9lel6zskvwtvlg5vhwpu9c9wawtvauhe
noisvaloper1a29m2lcdxdvsmyyxpqv00xc9my9excvs86xpet
noisvaloper1he6w66evpp5k85yz3wsw9le9m85e2y5tarvq4e
noisvaloper1eqj3augdjxt5le5m5zquytlpaj46gfaesxkqe8
noisvaloper12x3jq2w4svrzv0mg0xfvyvexjurg734z82xjth
noisvaloper19kzucp809gwek59uz5lvzjfsgyh9gwz2lxm0r6
noisvaloper1rjrhem49wz2l8d39x92uz2l9gsp0nr7ajxr837
noisvaloper1ptzpqvqz2eqldz5q5cuvcpg9ca2lls90uge2wt
noisvaloper1d0pzh0ysr3kc7a49kk5lsxlaj3p3wfrcxwnulc
noisvaloper1japw0qknmdey9p9r9j95qr9pm5wmpupkch0rux
noisvaloper1eykwyss2rtuhqcqw3gryz52jnfmvpep9hwm224
noisvaloper1gykx5en0543f47yd6m0g69c04ah63zk8qx488k
`
  .trim()
  .split("\n")
  .map((row) => row.trim())
  .filter((row) => row !== "");

const chunkSize = 15; // Delegations per transactions
let chunkId = 1;
for (let i = 0; i < recipients.length; i += chunkSize) {
  const chunk = recipients.slice(i, i + chunkSize);
  console.log(`Chunk ${chunkId++} (${chunk.length}):`, chunk.join(","));

  const execs = chunk.map((recipient): ExecuteInstruction => {
    const msg: IcecubeExecuteMsg = {
      delegate: {
        addr: recipient,
        amount: `${amount}000000`, // in unois
      },
    };
    return {
      contractAddress: icecubeAddress,
      msg,
    };
  });

  console.log(`Creating transaction with ${execs.length} messages`);

  // Uncomment to activate
  // const result = await client.executeMultiple(account.address, execs, 1.1);
  // console.log(result);

  await sleep(5000); // Let chain chill
}

console.log("Ok.");
