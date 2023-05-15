# Clarinet Testing for PoX 

*DISCLAIMER*: because in this repo we are testing a standalone version of PoX some functionality might be missing or limit. For example the locked/unlocked balance of STX is not updated by the standalone PoX contract because these balances are updated by the blockchain node and stored outside of the PoX smart contract.

`ok | 17 passed | 0 failed (1s)`


## Run

```sh
clarinet test             # Run tests
clarinet test --coverage  # Run tests and generate coverage.lcov file
```

## Notes

- `pox-mainnet.clar` constants are hardcoded in to `pox-3.clar`.
- `The build-in function `stx-account` doesn't work in this test environment
  - A drop-in replacement function, `stx-account-from-pox-data`, is hardcoded into `pox-3.clar`
  - Instances of `stx-account` have been commented out from `pox-3.clar` and replaced with this function
  - This function may not work in all cases. In particular, `unlock-height` is probably not correct

## Functions

### Coverage

B: Basic tests

```clarity
B (define-public (set-burnchain-parameters (first-burn-height uint)
(define-public (disallow-contract-caller (caller principal))
(define-public (allow-contract-caller (caller principal) (until-burn-ht (optional uint)))
B (define-public (stack-stx (amount-ustx uint)
B (define-public (revoke-delegate-stx)
B (define-public (delegate-stx (amount-ustx uint)
(define-public (stack-aggregation-commit (pox-addr { version: (buff 1), hashbytes: (buff 32) })
(define-public (stack-aggregation-commit-indexed (pox-addr { version: (buff 1), hashbytes: (buff 32) })
(define-public (stack-aggregation-increase (pox-addr { version: (buff 1), hashbytes: (buff 32) })
(define-public (delegate-stack-stx (stacker principal)
(define-public (reject-pox)
B (define-public (stack-increase (increase-by uint))
(define-public (stack-extend (extend-count uint)
(define-public (delegate-stack-increase
(define-public (delegate-stack-extend
```

### Costs

<img width="1427" alt="image" src="https://user-images.githubusercontent.com/30682875/234330158-6064eaf6-6120-422d-b11a-586677c68e76.png">

