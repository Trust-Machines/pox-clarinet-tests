import { assertEquals } from "https://deno.land/std@0.90.0/testing/asserts.ts";
import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet@v1.5.4/index.ts";
import { Pox3 } from "./models/pox-3.ts";

Clarinet.test({
  name: "reject-pox: Test PoX rejection",
  async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get("deployer")!;
        const wallet_1 = accounts.get("wallet_1")!;
        const wallet_2 = accounts.get("wallet_2")!;

        // Set burnchain parameters
        const firstBurnHeight = 0;
        const prepareCycleLength = 100;
        const rewardCycleLength = 2100;
        const rejectionFraction = 15; // Set low rejection fraction
        const begin21RewardCycle = 0;

        let block = chain.mineBlock([
            Tx.contractCall(
                "pox-3",
                "set-burnchain-parameters",
                [
                    types.uint(firstBurnHeight),
                    types.uint(prepareCycleLength),
                    types.uint(rewardCycleLength),
                    types.uint(rejectionFraction),
                    types.uint(begin21RewardCycle),
                ],
                deployer.address
            ),
        ]);

        assertEquals(block.receipts.length, 1);
        block.receipts[0].result.expectOk().expectBool(true);

        // Get PoX info, confirm rejection fraction changed
        let poxInfo = chain.callReadOnlyFn(
                "pox-3",
                "get-pox-info",
                [],
                deployer.address
            )
            .result
            .expectOk()
            .expectTuple();

        poxInfo['rejection-fraction'].expectUint(rejectionFraction);

        // PoX should be active next cycle
        block = chain.callReadOnlyFn(
            "pox-3",
            "is-pox-active",
            [
                types.uint(1),
            ],
            deployer.address
        ).result.expectBool(true);

        // Wallet 1 rejects PoX rewards
        block = chain.mineBlock([
            Tx.contractCall(
                "pox-3",
                "reject-pox",
                [],
                wallet_1.address
            ),
        ]);

        assertEquals(block.receipts.length, 1);
        block.receipts[0].result.expectOk().expectBool(true);

        // PoX should still be active next cycle
        block = chain.callReadOnlyFn(
            "pox-3",
            "is-pox-active",
            [
                types.uint(1),
            ],
            deployer.address
        ).result.expectBool(true);

        // Wallet 2 rejects PoX rewards
        block = chain.mineBlock([
            Tx.contractCall(
                "pox-3",
                "reject-pox",
                [],
                wallet_2.address
            ),
        ]);

        assertEquals(block.receipts.length, 1);
        block.receipts[0].result.expectOk().expectBool(true);

        // PoX should not be active next cycle
        block = chain.callReadOnlyFn(
            "pox-3",
            "is-pox-active",
            [
                types.uint(1),
            ],
            deployer.address
        ).result.expectBool(false);
  },
});

Clarinet.test({
  name: "reject-pox: Can't vote multiple times",
  async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get("deployer")!;
        const wallet_1 = accounts.get("wallet_1")!;
        const wallet_2 = accounts.get("wallet_2")!;

        // Wallet 1 rejects PoX rewards
        let block = chain.mineBlock([
            Tx.contractCall(
                "pox-3",
                "reject-pox",
                [],
                wallet_1.address
            ),
        ]);

        assertEquals(block.receipts.length, 1);
        block.receipts[0].result.expectOk().expectBool(true);

        // Wallet 1 rejects PoX rewards again
        block = chain.mineBlock([
            Tx.contractCall(
                "pox-3",
                "reject-pox",
                [],
                wallet_1.address
            ),
        ]);

        assertEquals(block.receipts.length, 1);
        block.receipts[0].result.expectErr().expectInt(Pox3.ERR_STACKING_ALREADY_REJECTED);
  },
});

Clarinet.test({
  name: "reject-pox: Stacker can't vote",
  async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get("deployer")!;
        const wallet_1 = accounts.get("wallet_1")!;
        const wallet_2 = accounts.get("wallet_2")!;

        const initialAmount = 50000;
        const startBurnHeight = 10;
        const lockPeriod = 10;

        // Stack STX
        let block = chain.mineBlock([
            Tx.contractCall(
                "pox-3",
                "stack-stx",
                [
                    types.uint(initialAmount),
                    types.tuple({
                        version: types.buff(Uint8Array.from([4])),
                        hashbytes: types.buff(
                            Uint8Array.from([
                                1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1
                            ])
                        ),
                    }),
                    types.uint(startBurnHeight),
                    types.uint(lockPeriod),
                ],
                wallet_1.address
            ),
        ]);

        assertEquals(block.receipts.length, 1);
        block.receipts[0].result.expectOk();

        // Wallet 1 rejects PoX rewards
        block = chain.mineBlock([
            Tx.contractCall(
                "pox-3",
                "reject-pox",
                [],
                wallet_1.address
            ),
        ]);

        assertEquals(block.receipts.length, 1);
        block.receipts[0].result.expectErr().expectInt(Pox3.ERR_STACKING_ALREADY_STACKED);
  },
});