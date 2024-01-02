## Updating the list of allowlisted bots

### Why not permissionless?

Bot list are permissioned because we want to make sure the incentives go to many operators not just one fast operator.
For that we need to ensure that one operator = 1 identity.

### How to allowlist my bot?
## For Testnet:
- Open a PR with the following changes
- go to the folder corresponding to the network of your choice (ie. nois-1 or nois-testnet-005)
- Edit the drand-bot-allowlist.sh with the address you want to use as bot followed by your discord handle.
- if you want to change your address make sure you add the old one to the remove list otherwise the PR won't be accepted because at any point in time 1 operator cannot have more than 1 allowlisted address.
## For Mainnet:
Raise a text governance proposal and say who you are and that you want to get allowlisted. Remember that submitting the randomness is permissionless but getting allowlisted is being eligible for getting incentives upon randomness submissions.

Ps: We don't have a pipeline that will automatically update the changes upon merge to main but we willmake sure we manually sync this for now.
Thank you
