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
  name: "stack-stx: Successfully lock STX",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const pox3 = new Pox3(chain, accounts.get("deployer")!);
    const sender = accounts.get("wallet_1")!;
    const initialBalance = sender.balance;
    const amountStacked = 800000;
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

    // Advance to next reward cycle
    pox3.advanceByFullCycle();

    // Confirm STX is locked
    let account = pox3.stxAccountFromPoxData(sender.address)
      .result
      .expectTuple();

    account.unlocked.expectUint(initialBalance - amountStacked);
    account.locked.expectUint(amountStacked);
  },
});

Clarinet.test({
  name: "stack-stx: Already stacking user cannot stack again",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const sender = accounts.get("wallet_1")!;
    const initialAmount = 50000;
    const startBurnHeight = 10;
    const lockPeriod = 10;

    // First stack operation
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
        sender.address
      ),
    ]);

    assertEquals(block.receipts.length, 1);
    block.receipts[0].result.expectOk();

    // Second stack operation (attempting to stack again)
    block = chain.mineBlock([
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
        sender.address
      ),
    ]);

    assertEquals(block.receipts.length, 1);
    block.receipts[0].result
      .expectErr()
      .expectInt(Pox3.ERR_STACKING_ALREADY_STACKED);
  },
});

Clarinet.test({
  name: "stack-stx: User with insufficient funds cannot stack",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const sender = accounts.get("wallet_1")!;
    const initialAmount = 100000000; // An amount greater than the user's balance
    const startBurnHeight = 10;
    const lockPeriod = 10;

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
        sender.address
      ),
    ]);

    assertEquals(block.receipts.length, 1);
    block.receipts[0].result
      .expectErr()
      .expectInt(Pox3.ERR_STACKING_INSUFFICIENT_FUNDS);
  },
});

Clarinet.test({
  name: "stack-stx: User with invalid start burn height cannot stack",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const sender = accounts.get("wallet_1")!;
    const initialAmount = 50000;
    const invalidStartBurnHeight = 9999; // An invalid start burn height
    const lockPeriod = 10;

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
          types.uint(invalidStartBurnHeight),
          types.uint(lockPeriod),
        ],
        sender.address
      ),
    ]);

    assertEquals(block.receipts.length, 1);
    block.receipts[0].result
      .expectErr()
      .expectInt(Pox3.ERR_INVALID_START_BURN_HEIGHT);
  },
});

Clarinet.test({
  name: "stack-stx: User who is already delegating cannot stack",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const sender = accounts.get("wallet_1")!;
    const delegate = accounts.get("wallet_2")!;
    const initialAmount = 50000;
    const startBurnHeight = 10;
    const lockPeriod = 10;

    // Delegate operation
    let block = chain.mineBlock([
      Tx.contractCall(
        "pox-3",
        "delegate-stx",
        [
          types.uint(initialAmount),
          types.principal(delegate.address),
          types.none(),
          types.none(),
        ],
        sender.address
      ),
    ]);

    assertEquals(block.receipts.length, 1);
    block.receipts[0].result.expectOk();

    // Attempt to stack after delegating
    block = chain.mineBlock([
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
        sender.address
      ),
    ]);

    assertEquals(block.receipts.length, 1);
    block.receipts[0].result
      .expectErr()
      .expectInt(Pox3.ERR_STACKING_ALREADY_DELEGATED);
  },
});
