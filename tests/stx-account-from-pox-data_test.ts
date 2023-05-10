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
  name: "stx-account-from-pox-data: Check account after stacking",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const sender = accounts.get("wallet_1")!;
    const pox3 = new Pox3(chain, accounts.get("deployer")!);
    const initialBalance = sender.balance;
    const amountStacked = 50000;
    const startBurnHeight = 10;
    const lockPeriod = 10;

    let block = chain.mineBlock([
      Tx.contractCall(
        "pox-3",
        "stack-stx",
        [
          types.uint(amountStacked),
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
        sender.address
      ),
    ]);

    assertEquals(block.receipts.length, 1);
    block.receipts[0].result.expectOk();

    // Check we are on cycle 0
    pox3.currentPoxRewardCycle()
      .result
      .expectUint(0);

    // Confirm STX is not locked yet
    let account = pox3.stxAccountFromPoxData(sender.address)
      .result
      .expectTuple();

    account.unlocked.expectUint(initialBalance);
    account.locked.expectUint(0);

    // Advance to next cycle
    chain.mineEmptyBlockUntil(3000);

    // Check we are on cycle 1
    pox3.currentPoxRewardCycle()
      .result
      .expectUint(1);

    // Confirm STX is now locked
    account = pox3.stxAccountFromPoxData(sender.address)
      .result
      .expectTuple();

    account.unlocked.expectUint(initialBalance - amountStacked);
    account.locked.expectUint(amountStacked);
  },
});