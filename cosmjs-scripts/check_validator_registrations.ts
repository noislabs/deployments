import { toBech32, fromBech32 } from "@cosmjs/encoding";
import { QueryClient, setupStakingExtension } from "@cosmjs/stargate";
import { Tendermint34Client } from "@cosmjs/tendermint-rpc";
import { assert, sleep } from "@cosmjs/utils";

await sleep(500); // wait until prompt is printed

const addresses = `
nois17quau8ah8zdadkyflz0h6ead27n2yjj90v49lf
nois1pm7zfz2z80wyl5clt3dhjduwc93gw7yh33dnwf
nois15kzwgak8upfc498ve80u9zjcd459dj384n663r
nois1au4axasl3agzl9smd9zhqlx5hpg2ezdyx7r2c3
nois1088zdc7lxqvh7mwyv46cr6s3asydvwe2jd2plw
nois1j7fgj7v9nqjg6wfda9paldcxezd8yv4q0tq5yj
nois1xwazl8ftks4gn00y5x3c47auquc62ssu5rms2g
nois1tej5lqkljmnd8mszhkg0aepn5qaltyekcwxeqy
nois104hetrwd96sgj9tjdwpf6wkwflxtmq7nu7eae9
nois10hmy2yhwhqqe8p7ax0hrdt4uxkumlhcfltyh07
nois1vj6ydcqycrxe8lnn8z75pdy52gvr0nzuh9pen3
nois10wxn2lv29yqnw2uf4jf439kwy5ef00qdpcplw7
nois1z8jthusnem2h2qfa43gzv2eqv3zqmwf6s323hk
nois1ua2qf3vfu5v4f547ndvze0jptm3zxl8rwtll0k
nois1uwvvx04c99pakexg0ydgqkr2e6f0fcsm57jyrt
nois177arfmywkyk06854q5kgrlw6vhm08p5600nay2
nois14c7k4cvjpsx0vgrdsk9hhcc6qycq20rqeu5a63
nois1g9u6lynujx5r4cn74y0hkknjqkx72s6tupar2r
nois1cd3d6zh2yp0me78r4kwhfyvg6psm5y56ymg2cj
nois1em0rgk80hmvel9vlaqthrvu9avfp0kgwajq398
nois1mmvlk84t25p3n7vn6d8w2jkt5lqet52vpk4xrv
nois1qzpl6zv2n8w4nqszrqsnxa8jzys8u9qxaha67x
nois1u4v6aw9vpzvmcwux9mygc2fkgs64g27gku2ej4
nois15rph43lzyqe2gem93nxxxalxqvqe7gg4q2sk5j
nois1wsrjxq4tnt5sxj6p8v524zj4nf0d776y2rrcz9
nois1ha9myf0achfplyqnc72y0gvltfy2sqfsp33sla
nois1ysszgcfrl8tnq3yu4pd6dkzzs0awljqnjdxqqp

nois19yul78yu9jzay9afsyjgmv0pk0k5rl803agdxj
nois1knljz5pa3uyh7n83e54p6x4u0g3crdjlxqk4dm
nois16af5x850nre0qu8gprux3qhfnaq4k7s7nu8nku
nois1fe7ju873fkknmfrmytaft93y5rlf0xcrptnsuz
nois140l6y2gp3gxvay6qtn70re7z2s0gn57za3ww2e
nois1j56lgzgtjpc6mnp2q73tat58da52j6nwnasg0e
nois1derp7w6q5pg37j9nuv42fzv7zsdu58ev2hu84w
nois1qjftpa8wuyt2zpe6ll5qu23f6xxjpvk7ffmqce
nois1hlpj3lw7d2shtxqtjwn0y78vq903e48apyxx98
nois1m75ljwympv4dys9z57nkzlk0x9ww9h72jhghcm
nois1pq6spkms6p42djr9tsfqmlnngaf7aht8t84anz
nois19f0w9svr905fhefusyx4z8sf83j6et0g3ramh5
nois1k4epy263g5wuzeu92396lmq8y62jxgce7vrkpm
nois1xmvq9x8mttehk6602smz3zdlcymgxsclx5at5n
nois1uz533k43tuhkwhpgv5g7jev8dyts0q9wa4xn48
nois1enwhnv85g4n99a2kzg8gey22xu6u43l4exqxnp
nois12r4sun4wmqd9vrj039nalup0aj02efpfv3sqwk
nois1jcqxnmtu7d9dl2llty3wsfrky52dffrkrgu7v9
nois1pk9gxn40gxadjassmtpnpl0zdc2wgxhdm270wr
nois155a3dkeqmzjwdfp08wp7yzwvu404l2mtcyd5ft
nois1xt47alla8xrwy4e2r4gv0uey4q9uf2j8u0qfwt
nois1j2p6k6dz8hq0wdusvd0kpm45v259uk8c5v75he
nois1zdc69y6vhmsmgne4vn0fkh2nurtfjk5e4uwk9g
nois1r4dnm99wuv93utu07astefy9n75wa6x5th6y0w
nois14fewxgk259tndya35f9t6q9awxd6xckzduljvu
nois1d3vz6wce55e2tafuys4wadtte9ggdfzk9xy24e
nois14de6yy0g7kp5z9w7tg8wsnp8yg6vzxy4vm0eyl
nois1xxwqq6hgg5e5sd786fmecq0mpxqd7y9qw47rke
nois1ywe2pw0vjz6cdgfekgg9mcdtmtcnqr897g759r
nois1uklqslvu2dht3jp63np5mqsqu73ckpa4xsx0ty
nois1gv0d8lyttmtnl2pe64m382p84c98te50q0sffs
nois1qrnl66kmaf276wd0fj2fp6cnnj9gta5zr8fa4n
nois1v609zcn05sdkhe5z4u7laugvdqah6326qarp4m
nois1kmf9w8nmvsuaps2kf4smhphnj8unjcaksh2rah
nois1fnfwprtjc6x4tk5u4fsnglr6e4n5fs9wt7mmcz
nois1ljvdlhws6j5md5srpy7jdrxpuhpx2k7wy80v8g
nois1llkf6x237xadn7sqlscqgpg4e79xcwl4k7rnr0
nois1cxymlc09tnlnel4etwegphqu08tylqj5vvwxjv
nois10hcnj06d32khtknfgxkcs05amnw4wrl8w23c8m
nois1qlq3c2pjjha03h7eg4p462m7agum57f5yrlz49
nois18r09wuucu8qhejt7ujsl2gh7704c65r8eek9hv
nois1vujfft38ggemn4jzxv2z427yl950396jeqx4dw
nois1n3rae5ctxq0lxgc2dd6sfu653xg0jmre5s6aml
nois1jjwhgtf7a60y27slquc52z2efnhlu0wds6sf0m
nois1z8nny6dyww8pgul3rcq4ctjq8j0sm24rk3ldd6
nois1hwg54kyrl5p8p3h26h8z56k07arzh6mruxma7g
nois15kywkhdljlkfvvzwkshnquz2x63nrxew2ej93a
nois120c0gc9uhtg74rseeu0p5f5mu8vefpzf25yfn0
nois1er34zm90nlm3xmhwx2zpt4gnzd4htmj2jaa0dk
nois1g8rqhyk6ghk5q3qadd6h7vc7vcf5j5jjqfadu8
nois1gjtvly9lel6zskvwtvlg5vhwpu9c9waw2v0awd
nois1a29m2lcdxdvsmyyxpqv00xc9my9excvsx65qql
nois1he6w66evpp5k85yz3wsw9le9m85e2y5tur7pvd
nois1eqj3augdjxt5le5m5zquytlpaj46gfae3xypqn
nois12x3jq2w4svrzv0mg0xfvyvexjurg734zx25njr
nois19kzucp809gwek59uz5lvzjfsgyh9gwz27xfw6w
nois1rjrhem49wz2l8d39x92uz2l9gsp0nr7anx3xg2
nois1ptzpqvqz2eqldz5q5cuvcpg9ca2lls90agtthl
nois1d0pzh0ysr3kc7a49kk5lsxlaj3p3wfrc8wpaxv
nois1japw0qknmdey9p9r9j95qr9pm5wmpupkehaz9j
nois1eykwyss2rtuhqcqw3gryz52jnfmvpep9kwftnp
nois1gykx5en0543f47yd6m0g69c04ah63zk8px8x7z
`.trim().split("\n").map(row => row.trim());


// console.log(addresses)

declare const process: any; // using Node.js, so we have this

const rpcEndpoint: string = process.env.RPC_ENDPOINT;
assert(rpcEndpoint, "RPC_ENDPOINT not set");

const tmClient = await Tendermint34Client.connect(rpcEndpoint);
const client = QueryClient.withExtensions(tmClient, setupStakingExtension);

let registered = 0;
let jailed = 0;
let unregistered = 0;

for (const address of addresses) {
  if (!address) {
    console.log(""); // empty cell in the sheet
    unregistered += 1;
    continue;
  }

  const valoperAddr = toBech32("noisvaloper", fromBech32(address).data);

  try {
    const { validator } = await client.staking.validator(valoperAddr);
    assert(validator);
    if (validator.jailed) {
      console.log(`${valoperAddr} (jailed)`);
      jailed += 1;
    } else {
      console.log(`${valoperAddr}`);
      registered += 1;
    }
  } catch (e) {
    if (e.toString().match(/key not found/)) {
      console.log(""); // not registered
      unregistered += 1;
    } else {
      throw e;
    }
  }
}

console.log(`Registered: ${registered} Jailed: ${jailed} Unregistered: ${unregistered}`);
