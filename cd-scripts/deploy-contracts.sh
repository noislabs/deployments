#!/bin/bash

set -ex

#PREREQS
# 0 You need Install yq and fetch
# 1 For fetch to work, Get a github token and run export GITHUB_OAUTH_TOKEN=
# 2 You need to install the specific binary of the chain you want to deploy to.
# 3 Edit the CHAIN SPECIFIC PARAMS
# 4 If the chain to deploy to is mainnet or no faucet can be provisioned in the params then you need to fill your key with some tokens

discord_notify () {
  echo "$2 : notify on discord"
  curl  -H "Content-Type: application/json" \
        -H "Content-Type:application/json" \
        -XPOST -d '{"content": "'"_________________\n**$2** - **$3** :\n Version: **$4**\n Address:  **$5** "'"}' \
        $1;
}

TEMPLATE_MIN_ROUND=$(curl https://drand.cloudflare.com/dbd506d6ef76e5f386f41c651dcb808c5bcbd75471cc4eafa3f4df7ad4e4c493/public/latest | jq -r '.round')
TEMPLATE_MIN_ROUND=$((TEMPLATE_MIN_ROUND + 28800)) #1 day

SCRIPT_DIR="cd-scripts"
KEYRING_KEY_NAME="deployment-key"
INSTANTIATION_SALT=11

cd $SCRIPT_DIR

if [ -f "env_secrets.sh" ]; then
    source env_secrets.sh;
else
  echo "some secrets are missing. create env_secrets.sh file"
fi

chains_list=($(yq -r '.chains[].name' config.yaml))
ignore=(  "elgafar-1" "juno-1"  "nois-1" "euphoria-2")
#ignore=( "juno-1" "uni-6" "euphoria-2")


for chain in "${chains_list[@]}"
do
    # Check if the current chain is in the ignore list
    if [[ "${ignore[@]}" =~ "$chain" ]]; then
        echo "Skipping $chain, it is in the ignore list"
        continue
    fi
    contracts_list=($(yq -r '.chains[]| select(.name=="'"$chain"'").wasm.contracts[].name' config.yaml))
    BINARY_NAME=($(yq -r '.chains[]| select(.name=="'"$chain"'").binary_name' config.yaml))
    CHAIN_ID=($(yq -r '.chains[]| select(.name=="'"$chain"'").chain_id' config.yaml))
    DENOM=($(yq -r '.chains[]| select(.name=="'"$chain"'").denom' config.yaml))
    FAUCET_URL=($(yq -r '.chains[]| select(.name=="'"$chain"'").faucet' config.yaml))
    GAS_PRICES=($(yq -r '.chains[]| select(.name=="'"$chain"'").gas_price' config.yaml))
    RELAYER_IBC_SRC_CONNECTION=($(yq -r '.chains[]| select(.name=="'"$chain"'").ibc_connection.src' config.yaml))
    RELAYER_IBC_DEST_CONNECTION=($(yq -r '.chains[]| select(.name=="'"$chain"'").ibc_connection.dest' config.yaml))
    PREFIX=($(yq -r '.chains[]| select(.name=="'"$chain"'").prefix' config.yaml))
    NODE_URL=($(yq -r '.chains[]| select(.name=="'"$chain"'").rpc[0]' config.yaml))
    DEPLOYMENT_KEY_BECH_ADDR=$($BINARY_NAME keys show $KEYRING_KEY_NAME -a )

    echo "$chain : add key if it does not exist"
    $BINARY_NAME keys show $KEYRING_KEY_NAME >/dev/null || echo $MNEMONIC | $BINARY_NAME keys  add  $KEYRING_KEY_NAME --recover

    if [ "$FAUCET_URL" == "~" ] ;
        then echo "$chain : Info: Faucet is not relevant here";
        else echo "$chain : Trying to add credit for chain '$CHAIN_ID' with faucet '$FAUCET_URL'";
          curl -XPOST -H 'Content-type: application/json' -d "{\"address\":\"$DEPLOYMENT_KEY_BECH_ADDR\",\"denom\":\"$DENOM\"}" $FAUCET_URL/credit
          echo "$chain - $contract : querying new balance ..."
          $BINARY_NAME query bank balances $DEPLOYMENT_KEY_BECH_ADDR --node=$NODE_URL | yq -r '.balances'
    fi

    for contract in "${contracts_list[@]}"
    do

        GIT_CONTRACTS_URL=$(yq -r '.chains[]| select(.name=="'"$chain"'").wasm.contracts[]| select(.name=="'"$contract"'").url' config.yaml)
        GIT_CONTRACTS_TAG=$(yq -r '.chains[]| select(.name=="'"$chain"'").wasm.contracts[]| select(.name=="'"$contract"'").version' config.yaml)
        GIT_CONTRACTS_ASSET=$(yq -r '.chains[]| select(.name=="'"$chain"'").wasm.contracts[]| select(.name=="'"$contract"'").git_asset_name' config.yaml)
        CONTRACTS_ADDRESS=$(yq -r '.chains[]| select(.name=="'"$chain"'").wasm.contracts[]| select(.name=="'"$contract"'").address' config.yaml)
        CONTRACT_INSTATIATION_MSG=$(yq -r '.chains[]| select(.name=="'"$chain"'").wasm.contracts[]| select(.name=="'"$contract"'").instantiation_msg' config.yaml)
        NOIS_PROXY_CONTRACT_ADDRESS=$(yq -r '.chains[]| select(.name=="'"$chain"'").wasm.contracts[]| select(.name=="nois-proxy").address' config.yaml)
        NOIS_SINK_CONTRACT_ADDRESS=$(yq -r '.chains[]| select(.name=="'"$chain"'").wasm.contracts[]| select(.name=="nois-sink").address' config.yaml)
        NOIS_PAYMENT_CODE_ID=$(yq -r '.chains[]| select(.name=="'"$chain"'").wasm.contracts[]| select(.name=="nois-payment").code_id' config.yaml)

        CONTRACT_INSTATIATION_MSG=$(echo $CONTRACT_INSTATIATION_MSG | sed "s#TEMPLATE_NOIS_PROXY#$NOIS_PROXY_CONTRACT_ADDRESS#" )
        CONTRACT_INSTATIATION_MSG=$(echo $CONTRACT_INSTATIATION_MSG | sed "s#TEMPLATE_MIN_ROUND#$TEMPLATE_MIN_ROUND#" )
        CONTRACT_INSTATIATION_MSG=$(echo $CONTRACT_INSTATIATION_MSG | sed "s#TEMPLATE_DENOM#$DENOM#" )
        TEMPLATE_WITHDRAWAL_ADDRESS=$DEPLOYMENT_KEY_BECH_ADDR
        CONTRACT_INSTATIATION_MSG=$(echo $CONTRACT_INSTATIATION_MSG | sed "s#TEMPLATE_WITHDRAWAL_ADDRESS#$TEMPLATE_WITHDRAWAL_ADDRESS#" )
        CONTRACT_INSTATIATION_MSG=$(echo $CONTRACT_INSTATIATION_MSG | sed "s#TEMPLATE_SINK_ADDR#$NOIS_SINK_CONTRACT_ADDRESS#" )
        CONTRACT_INSTATIATION_MSG=$(echo $CONTRACT_INSTATIATION_MSG | sed "s#TEMPLATE_PAYMENT_CODE_ID#$NOIS_PAYMENT_CODE_ID#" )


        if [ "$CONTRACTS_ADDRESS" == "~" ] ||  [ "$CONTRACTS_ADDRESS" == "null" ] || [ ${#CONTRACTS_ADDRESS} -le 10 ] ;
        then

          echo "$chain - $contract : downloading $contract from $GIT_CONTRACTS_URL from release $GIT_CONTRACTS_TAG"
          fetch --repo="$GIT_CONTRACTS_URL" --tag="$GIT_CONTRACTS_TAG" --release-asset="$GIT_CONTRACTS_ASSET.wasm" ../artifacts

          echo "$chain - $contract : deployment of $contract in $chain"

          echo "$chain - $contract : storing contract"
          sleep 2
          CODE_ID=$($BINARY_NAME tx wasm store ../artifacts/$GIT_CONTRACTS_ASSET.wasm --instantiate-anyof-addresses $DEPLOYMENT_KEY_BECH_ADDR --from $KEYRING_KEY_NAME --chain-id $CHAIN_ID   --gas=auto --gas-adjustment 1.2  --gas-prices=$GAS_PRICES$DENOM --broadcast-mode=block --node=$NODE_URL -y |yq -r '.logs[0].events[] | select(.type == "cosmwasm.wasm.v1.EventCodeStored") | .attributes[] | select(.key == "code_id") | .value' | sed 's/"//g') #for wasmd 0.29.0-rc2 and maybe above, change attributes[0] --> attributes[1]
          sleep 2
          yq -i '(.chains[]| select(.name=="'"$chain"'").wasm.contracts[]| select(.name=="'"$contract"'").code_id) = "'"$CODE_ID"'"' config.yaml
          # skip CODE_ID variable is null
          if [ "$CODE_ID" = "null" ]  ; then
              echo "Skipping $contract, CODE_ID is null "
              continue
          fi
          if [ "$contract" = "nois-payment" ]  ; then
              echo "Skipping $contract, contract is not meant to be instantiated"
              continue
          fi

          echo "$chain - $contract : Instantiating contract"
          sleep 2
          CONTRACT_ADDRESS=$($BINARY_NAME tx wasm instantiate2 $CODE_ID $CONTRACT_INSTATIATION_MSG $INSTANTIATION_SALT   --label=$contract --admin $($BINARY_NAME keys show $KEYRING_KEY_NAME -a )  --from $KEYRING_KEY_NAME --chain-id $CHAIN_ID   --gas=auto --gas-adjustment 1.2  --gas-prices=$GAS_PRICES$DENOM --broadcast-mode=block --node=$NODE_URL  -y |yq -r '.logs[0].events[] | select(.type == "cosmwasm.wasm.v1.EventContractInstantiated") | .attributes[] | select(.key == "contract_address") | .value' | tr -d '"' )
          yq -i '(.chains[]| select(.name=="'"$chain"'").wasm.contracts[]| select(.name=="'"$contract"'").address) = "'"$CONTRACT_ADDRESS"'"' config.yaml
          echo "$chain - $contract : CONTRACT_ADDRESS: $CONTRACT_ADDRESS"

          if [ -z ${DISCORD_WEBHOOK+x} ] ;
          then echo "WARN: Skipping notification because DISCORD_WEBHOOK is not set ";
          else discord_notify $DISCORD_WEBHOOK $chain $contract $GIT_CONTRACTS_TAG $CONTRACT_ADDRESS
          fi

        else
          echo "$chain - $contract : Skipping deployment because contract address is already set to $CONTRACTS_ADDRESS";
        fi

    done
    if [[ $PREFIX != *"nois"* ]]; #Customer chain
    then
        COUNTER_PART_CHAIN=$(yq -r '.chains[]| select(.name=="'"$chain"'").ibc_connection.counterpart.chain' config.yaml)
        COUNTER_PART_CONTRACT_NAME=$(yq -r '.chains[]| select(.name=="'"$chain"'").ibc_connection.counterpart.contract_name' config.yaml)
        NOIS_GATEWAY_CONTRACT_ADDRESS=$(yq -r '.chains[]| select(.name=="'"$COUNTER_PART_CHAIN"'").wasm.contracts[]| select(.name=="'"$COUNTER_PART_CONTRACT_NAME"'").address' config.yaml)
        echo $NOIS_GATEWAY_CONTRACT_ADDRESS
        TEMPLATE_NOIS_FAUCET=$(yq -r '.chains[]| select(.name=="'"$COUNTER_PART_CHAIN"'").faucet' config.yaml)
        TEMPLATE_NOIS_RPC=$(yq -r '.chains[]| select(.name=="'"$COUNTER_PART_CHAIN"'").rpc[0]' config.yaml)
        TEMPLATE_NOIS_GAS_PRICES=$(yq -r '.chains[]| select(.name=="'"$COUNTER_PART_CHAIN"'").gas_price' config.yaml)
        RELAYER_IBC_VERSION=$(yq -r '.ibc.version' config.yaml)
        RELAYER_DOCKER_IMAGE=$(yq -r '.ibc.relayer.docker_image' config.yaml)

        echo "$chain : generating relayer config"
        cp relayer/nois-relayer-config-template.yaml relayer/nois-relayer-config.yaml
        sed -i '' "s#TEMPLATE_RELAYER_NOIS_NAME#${COUNTER_PART_CHAIN}#" relayer/nois-relayer-config.yaml
        sed -i '' "s#TEMPLATE_RELAYER_NOIS_CHAIN_ID#${COUNTER_PART_CHAIN}#" relayer/nois-relayer-config.yaml
        sed -i '' "s#TEMPLATE_RELAYER_CHAIN_NAME#${CHAIN_ID}#" relayer/nois-relayer-config.yaml
        sed -i '' "s#TEMPLATE_CHAIN_ID#${CHAIN_ID}#" relayer/nois-relayer-config.yaml
        sed -i '' "s#TEMPLATE_CHAIN_PREFIX#${PREFIX}#" relayer/nois-relayer-config.yaml
        sed -i '' "s#TEMPLATE_CHAIN_DENOM#${DENOM}#" relayer/nois-relayer-config.yaml
        sed -i '' "s#TEMPLATE_NOIS_PROXY_CONTRACT_ADDRESS#${NOIS_PROXY_CONTRACT_ADDRESS}#" relayer/nois-relayer-config.yaml
        sed -i '' "s#TEMPLATE_CHAIN_FAUCET_URL#${FAUCET_URL}#" relayer/nois-relayer-config.yaml
        sed -i '' "s#TEMPLATE_CHAIN_NODE_URL#${NODE_URL}#" relayer/nois-relayer-config.yaml
        sed -i '' "s#TEMPLATE_NOIS_GATEWAY_CONTRACT_ADDRESS#${NOIS_GATEWAY_CONTRACT_ADDRESS}#" relayer/nois-relayer-config.yaml
        sed -i '' "s#TEMPLATE_NOIS_RPC#${TEMPLATE_NOIS_RPC}#" relayer/nois-relayer-config.yaml
        sed -i '' "s#TEMPLATE_NOIS_FAUCET#${TEMPLATE_NOIS_FAUCET}#" relayer/nois-relayer-config.yaml
        sed -i '' "s#TEMPLATE_GAS_PRICES#${GAS_PRICES}#" relayer/nois-relayer-config.yaml
        sed -i '' "s#TEMPLATE_NOIS_GAS_PRICES#${TEMPLATE_NOIS_GAS_PRICES}#" relayer/nois-relayer-config.yaml

        echo "$chain : building relayer docker"
        cd relayer
        docker build --build-arg CHAIN_NAME=$CHAIN_ID --build-arg NOIS_CHAIN_NAME=$COUNTER_PART_CHAIN -t $RELAYER_DOCKER_IMAGE:$CHAIN_ID-$NOIS_PROXY_CONTRACT_ADDRESS .
        docker run  -e RELAYER_MNEMONIC="$RELAYER_MNEMONIC" $RELAYER_DOCKER_IMAGE:$CHAIN_ID-$NOIS_PROXY_CONTRACT_ADDRESS ibc-setup keys list




        if [ ${#RELAYER_IBC_SRC_CONNECTION} -le 10 ] || [ ${#RELAYER_IBC_DEST_CONNECTION} -le 10 ] ;
        then
             echo "$chain : WARN: RELAYER_IBC_SRC_CONNECTION or RELAYER_IBC_DEST_CONNECTION are not defined ";
             echo "$chain : Creating a connection... please note the src and connection ids and define those variables accordingly"

             docker run  -e RELAYER_MNEMONIC="$RELAYER_MNEMONIC" $RELAYER_DOCKER_IMAGE:$CHAIN_ID-$NOIS_PROXY_CONTRACT_ADDRESS ibc-setup connect
        else
             echo "$chain : Info: RELAYER_IBC_SRC_CONNECTION and RELAYER_IBC_DEST_CONNECTION are set, skipping connection creation";
             # Create relayer docker production
             pwd
             DOCKER_IMAGE_TEMPLATE=$RELAYER_DOCKER_IMAGE:$CHAIN_ID-$NOIS_PROXY_CONTRACT_ADDRESS
             sed "s#DOCKER_IMAGE_TEMPLATE#${DOCKER_IMAGE_TEMPLATE}#" relayer-prd/Dockerfile_TEMPLATE > relayer-prd/Dockerfile
             sed "s#RELAYER_IBC_SRC_CONNECTION#${RELAYER_IBC_SRC_CONNECTION}#" relayer-prd/entrypoint-template.sh > relayer-prd/entrypoint.sh
             sed -i '' "s#RELAYER_IBC_DEST_CONNECTION#${RELAYER_IBC_DEST_CONNECTION}#" relayer-prd/entrypoint.sh
             sed -i '' "s#SRC_CHAIN#${chain}#" relayer-prd/entrypoint.sh
             sed -i '' "s#DEST_CHAIN#${COUNTER_PART_CHAIN}#" relayer-prd/entrypoint.sh
             cd relayer-prd
             docker build  -t $DOCKER_IMAGE_TEMPLATE-prd .
             docker push $DOCKER_IMAGE_TEMPLATE-prd
             cd ..
        fi


        echo "$chain : check if channel exists"
        channel_exists=true
        $BINARY_NAME query ibc channel channels  --node=$NODE_URL   --limit=100000 |yq -r '.channels[]|select(.version=="'"$RELAYER_IBC_VERSION"'")| select(.port_id=="'"wasm.$NOIS_PROXY_CONTRACT_ADDRESS"'").channel_id |length' -e || channel_exists=false
        if [ "$channel_exists" = true ];
        then
            echo "$chain : channel already exists. skipping channel creation"
        else
           echo "$chain : creating IBC channel"
           docker run  -e RELAYER_MNEMONIC="$RELAYER_MNEMONIC" $RELAYER_DOCKER_IMAGE:$CHAIN_ID-$NOIS_PROXY_CONTRACT_ADDRESS ibc-setup channel --src-connection=$RELAYER_IBC_SRC_CONNECTION --dest-connection=$RELAYER_IBC_DEST_CONNECTION --src-port=wasm.$NOIS_PROXY_CONTRACT_ADDRESS --dest-port=wasm.$NOIS_GATEWAY_CONTRACT_ADDRESS --version=$RELAYER_IBC_VERSION
        fi




        echo "$chain : pushing relayer docker so it is ready to be deployed"
        docker push $RELAYER_DOCKER_IMAGE:$CHAIN_ID-$NOIS_PROXY_CONTRACT_ADDRESS
        cd ../
    fi

done






