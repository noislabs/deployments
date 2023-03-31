set -ex
source drand-bot-allowlist.sh
source drand-bot-removelist.sh

NOIS_DRAND_CONTRACT=nois19w26q6n44xqepduudfz2xls4pc5lltpn6rxu34g0jshxu3rdujzsj7dgu8

noisd tx wasm execute $NOIS_DRAND_CONTRACT \
'{"update_allowlist_bots": {
    "add": ["'$(echo ${allowlist_addresses[@]} \
        | tr -d '"' \
        | sed 's/ /","/g')'"],"remove": ["'$(echo ${remove_addresses[@]} \
        | tr -d '"' \
        | sed 's/ /","/g')'"]}}' \
--from deployment-key \
--chain-id nois-1 \
--gas=auto \
--gas-adjustment 1.3 \
--gas-prices=0.05unois \
--broadcast-mode=block \
--node=https://nois-mainnet-rpc.bccnodes.com:443
