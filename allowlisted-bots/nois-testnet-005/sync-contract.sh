set -ex
source drand-bot-allowlist.sh
source drand-bot-removelist.sh

NOIS_DRAND_CONTRACT=nois14xef285hz5cx5q9hh32p9nztu3cct4g44sxjgx3dmftt2tj2rweqkjextk

noisd tx wasm execute $NOIS_DRAND_CONTRACT \
'{"update_allowlist_bots": {
    "add": ["'$(echo ${allowlist_addresses[@]} \
        | tr -d '"' \
        | sed 's/ /","/g')'"],"remove": ['$(echo ${remove_addresses[@]} \
        | tr -d '"' \
        | sed 's/ /","/g')']}}' \
--from deployment-key-testnet \
--chain-id nois-testnet-005 \
--gas=auto \
--gas-adjustment 1.3 \
--gas-prices=0.05unois \
--broadcast-mode=block \
--node=https://nois-testnet-rpc.polkachu.com:443
