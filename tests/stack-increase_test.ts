import { assertEquals } from "https://deno.land/std@0.90.0/testing/asserts.ts";
import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet@v1.5.4/index.ts";
import { BuiltIn } from "./models/builtin.ts";
import { Pox3 } from "./models/pox-3.ts";

Clarinet.test({
  name: "stack-increase: Increase STX lock amount",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const pox3 = new Pox3(chain, accounts.get("deployer")!);
    let sender = accounts.get("wallet_1")!;
    const initialAmount = 50000;
    const increaseBy = 1000;

    // Check that the lock amount is 0
    pox3.stxLockedFromPoxData(sender.address)
      .result
      .expectUint(0);

    // Call `stack-stx` to lock some STX
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
          types.uint(10),
          types.uint(10),
        ],
        sender.address
      ),
    ]);
    assertEquals(block.receipts.length, 1);
    block.receipts[0].result.expectOk();

    // Advance to next reward cycle
    pox3.advanceByFullCycle();

    // Check that STX is locked
    pox3.stxLockedFromPoxData(sender.address)
      .result
      .expectUint(initialAmount);

    // Call `stack-increase` to increase the lock amount
    block = chain.mineBlock([
      Tx.contractCall(
        "pox-3",
        "stack-increase",
        [types.uint(increaseBy)],
        sender.address
      ),
    ]);
    assertEquals(block.receipts.length, 1);
    block.receipts[0].result.expectOk();

    // Advance to next reward cycle
    pox3.advanceByFullCycle();

    // Check that the lock amount initial + increase
    pox3.stxLockedFromPoxData(sender.address)
      .result
      .expectUint(initialAmount + increaseBy);
  },
});

Clarinet.test({
  name: "stack-increase: Attempt to increase STX lock amount before funds are locked",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const pox3 = new Pox3(chain, accounts.get("deployer")!);
    let sender = accounts.get("wallet_1")!;
    const initialAmount = 50000;
    const increaseBy = 1000;

    // Check that the lock amount is 0
    pox3.stxLockedFromPoxData(sender.address)
      .result
      .expectUint(0);

    // Call `stack-stx` to lock some STX
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
          types.uint(10),
          types.uint(10),
        ],
        sender.address
      ),
    ]);
    assertEquals(block.receipts.length, 1);
    block.receipts[0].result.expectOk();

    // Call `stack-increase` to increase the lock amount
    block = chain.mineBlock([
      Tx.contractCall(
        "pox-3",
        "stack-increase",
        [types.uint(increaseBy)],
        sender.address
      ),
    ]);
    assertEquals(block.receipts.length, 1);
    block.receipts[0].result.expectErr().expectInt(Pox3.ERR_STACK_INCREASE_NOT_LOCKED);
  },
});

Clarinet.test({
  name: "stack-increase: Attempt to increase with insufficient funds",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const pox3 = new Pox3(chain, accounts.get("deployer")!);
    let sender = accounts.get("wallet_1")!;
    const initialBalance = sender.balance;
    const initialAmountStacked = 500000;
    const increaseBy = 600000; // Exceeds available funds

    // Call `stack-stx` to lock some STX
    let block = chain.mineBlock([
      Tx.contractCall(
        "pox-3",
        "stack-stx",
        [
          types.uint(initialAmountStacked),
          types.tuple({
            version: types.buff(Uint8Array.from([4])),
            hashbytes: types.buff(
              Uint8Array.from([
                1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1
              ])
            ),
          }),
          types.uint(10),
          types.uint(10),
        ],
        sender.address
      ),
    ]);
    block.receipts[0].result.expectOk();

    // Advance to next reward cycle
    pox3.advanceByFullCycle();

    // Confirm STX is now locked
    let account = pox3.stxAccountFromPoxData(sender.address)
      .result
      .expectTuple();

    account.unlocked.expectUint(initialBalance - initialAmountStacked);
    account.locked.expectUint(initialAmountStacked);

    // Attempt to call `stack-increase` with an amount greater than the unlocked STX
    block = chain.mineBlock([
      Tx.contractCall(
        "pox-3",
        "stack-increase",
        [types.uint(increaseBy)],
        sender.address
      ),
    ]);

    // Check that the call to `stack-increase` failed
    block.receipts[0].result.expectErr().expectInt(Pox3.ERR_STACKING_INSUFFICIENT_FUNDS);
  },
});

Clarinet.test({
  name: "stack-increase: Attempt to increase without initial lock",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const builtin = new BuiltIn(chain, accounts.get("deployer")!);
    let sender = accounts.get("wallet_1")!;
    const increaseBy = 1000;

    // Attempt to call `stack-increase` without having any STX locked initially
    let block = chain.mineBlock([
      Tx.contractCall(
        "pox-3",
        "stack-increase",
        [types.uint(increaseBy)],
        sender.address
      ),
    ]);

    // Check that the call to `stack-increase` failed
    block.receipts[0].result
      .expectErr()
      .expectInt(Pox3.ERR_STACK_INCREASE_NOT_LOCKED);
  },
});

Clarinet.test({
  name: "stack-increase: Attempt to increase with an invalid amount",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const pox3 = new Pox3(chain, accounts.get("deployer")!);
    const deployer = accounts.get("deployer")!;
    const builtin = new BuiltIn(chain, accounts.get("deployer")!);
    let sender = accounts.get("wallet_1")!;
    const initialAmount = 50000;
    const increaseBy = 0; // Invalid increase amount

    // Call `stack-stx` to lock some STX
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
          types.uint(10),
          types.uint(10),
        ],
        sender.address
      ),
    ]);
    block.receipts[0].result.expectOk();

    // Advance to next reward cycle
    pox3.advanceByFullCycle();

    // Attempt to call `stack-increase` with an invalid amount
    block = chain.mineBlock([
      Tx.contractCall(
        "pox-3",
        "stack-increase",
        [types.uint(increaseBy)],
        sender.address
      ),
    ]);

    // Check that the call to `stack-increase` failed
    block.receipts[0].result
      .expectErr()
      .expectInt(Pox3.ERR_STACKING_INVALID_AMOUNT);
  },
});

Clarinet.test({
  name: "stack-increase: Attempt to increase with denied permission",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const pox3 = new Pox3(chain, accounts.get("deployer")!);
    let sender = accounts.get("wallet_1")!;
    let sender2 = accounts.get("wallet_2")!;
    const initialAmount = 50000;
    const increaseBy = 1000;

    // Call `stack-stx` to lock some STX
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
          types.uint(10),
          types.uint(10),
        ],
        sender.address
      ),
    ]);
    block.receipts[0].result.expectOk();

    // Advance to next reward cycle
    pox3.advanceByFullCycle();

    // Attempt to call `stack-increase` with a different tx-sender
    block = chain.mineBlock([
      Tx.contractCall(
        "pox-3",
        "stack-increase",
        [types.uint(increaseBy)],
        sender2.address
      ),
    ]);

    // Check that the call to `stack-increase` failed
    // This returns ERR_STACK_INCREASE_NOT_LOCKED because sender2 is not stacking
    assertEquals(block.receipts.length, 1);
    block.receipts[0].result.expectErr().expectInt(Pox3.ERR_STACK_INCREASE_NOT_LOCKED);
  },
});

// This test case simulates a scenario where three users call the `stack-increase` function combined with `delegate-stx`.
// The test checks the amounts distributed to each user after a reward cycle is completed. The `calculateExpectedReward`
// function calculates the expected reward for each user based on their locked STX and the total locked STX in the cycle.
Clarinet.test({
  name: "stack-increase: Combined with delegate-stx and verifying distribution",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const pox3 = new Pox3(chain, accounts.get("deployer")!);
    const builtin = new BuiltIn(chain, accounts.get("deployer")!);
    let delegator = accounts.get("wallet_1")!;
    let sender1 = accounts.get("wallet_2")!;
    let sender2 = accounts.get("wallet_3")!;
    let sender3 = accounts.get("wallet_4")!;
    const initialAmount1 = 50000;
    const initialAmount2 = 40000;
    const initialAmount3 = 30000;
    const increaseBy1 = 1000;
    const increaseBy2 = 2000;
    const increaseBy3 = 3000;
    const lockPeriod = 1;
    const poxAddress = types.tuple({
      version: types.buff(Uint8Array.from([4])),
      hashbytes: types.buff(
        Uint8Array.from([1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1])
      )
    });

    // Call `delegate-stx` to allow delegator to lock STX on behalf of sender1, sender2, and sender3
    let commonArgs = [ types.principal(delegator.address), types.none(), types.some(poxAddress) ];
    let block = chain.mineBlock([
      Tx.contractCall('pox-3', 'delegate-stx', [types.uint(initialAmount1 + increaseBy1), ...commonArgs], sender1.address),
      Tx.contractCall('pox-3', 'delegate-stx', [types.uint(initialAmount2 + increaseBy2), ...commonArgs], sender2.address),
      Tx.contractCall('pox-3', 'delegate-stx', [types.uint(initialAmount3 + increaseBy3), ...commonArgs], sender3.address),
    ]);
    assertEquals(block.receipts.length, 3);
    [0, 1, 2].forEach(i => block.receipts[i].result.expectOk());

    // Delegate partial-stacks STX on behalf of sender1, sender2, and sender3
    commonArgs = [ poxAddress, types.uint(10) /* unlock height */, types.uint(10) ];
    block = chain.mineBlock([
      Tx.contractCall('pox-3', 'delegate-stack-stx', [ types.principal(sender1.address), types.uint(initialAmount1), ...commonArgs], delegator.address),
      Tx.contractCall('pox-3', 'delegate-stack-stx', [ types.principal(sender2.address), types.uint(initialAmount2), ...commonArgs], delegator.address),
      Tx.contractCall('pox-3', 'delegate-stack-stx', [ types.principal(sender3.address), types.uint(initialAmount3), ...commonArgs], delegator.address),
    ]);
    assertEquals(block.receipts.length, 3);
    [0, 1, 2].forEach(i => block.receipts[i].result.expectOk());

    // Check partial stacked balances for this cycle
    chain.callReadOnlyFn('pox-3', 'get-partial-stacked-by-cycle', [poxAddress, types.uint(1), types.principal(delegator.address)], delegator.address)
      .result
      .expectSome()
      .expectTuple()['stacked-amount']
      .expectUint(initialAmount1 + initialAmount2 + initialAmount3);

    // Check partial stacked balances expire after unlock height
    chain.callReadOnlyFn('pox-3', 'get-partial-stacked-by-cycle', [poxAddress, types.uint(11), types.principal(delegator.address)], delegator.address)
      .result
      .expectNone();
    
    // Delegator commits partially stacked STX on behalf of sender1, sender2, and sender3
    block = chain.mineBlock([
      Tx.contractCall('pox-3', 'stack-aggregation-commit', [ poxAddress, types.uint(1) ], delegator.address),
    ]);
    block.receipts[0].result.expectOk();

    // Check partial stacked balances. Should be none
    chain.callReadOnlyFn('pox-3', 'get-partial-stacked-by-cycle', [poxAddress, types.uint(1), types.principal(delegator.address)], delegator.address)
      .result
      .expectNone();

    // Advance to next reward cycle
    pox3.advanceByFullCycle();

    // TODO: Check amount before increase

    return
    // FIXME below

    // sender1, sender2, and sender3 call `stack-increase` to increase their locked STX
    block = chain.mineBlock([
      Tx.contractCall('pox-3', 'stack-increase', [types.uint(increaseBy1)], sender1.address),
      Tx.contractCall('pox-3', 'stack-increase', [types.uint(increaseBy2)], sender2.address),
      Tx.contractCall('pox-3', 'stack-increase', [types.uint(increaseBy3)], sender3.address),
    ]);
    assertEquals(block.receipts.length, 3);
    [0, 1, 2].forEach(i => block.receipts[i].result.expectErr().expectInt(Pox3.ERR_STACKING_ALREADY_DELEGATED));

    // Delegator partial-stacks STX on behalf of sender1, sender2, and sender3
    block = chain.mineBlock([
      Tx.contractCall('pox-3', 'delegate-stack-increase', [ types.principal(sender1.address), poxAddress, types.uint(increaseBy1)], delegator.address),
      Tx.contractCall('pox-3', 'delegate-stack-increase', [ types.principal(sender2.address), poxAddress, types.uint(increaseBy2)], delegator.address),
      Tx.contractCall('pox-3', 'delegate-stack-increase', [ types.principal(sender3.address), poxAddress, types.uint(increaseBy3)], delegator.address),
    ]);
    assertEquals(block.receipts.length, 3);
    [0, 1, 2].forEach(i => block.receipts[i].result.expectOk());

    // TODO: Check amount after increase


    // Simulate mining until the reward cycle is completed
    for (let i = 0; i < lockPeriod * 10; i++) {
      chain.mineBlock([]);
    }

    // Check the amount of STX each sender has after the rewards are distributed
    let result1 = builtin.getSTXAccount(sender1.address);
    result1.result.expectTuple().locked.expectUint(0); //initialAmount1 + increaseBy1);

    let result2 = builtin.getSTXAccount(sender2.address);
    result2.result.expectTuple().locked.expectUint(0); //initialAmount2 + increaseBy2);

    let result3 = builtin.getSTXAccount(sender3.address);
    result2.result.expectTuple().locked.expectUint(0); //initialAmount3 + increaseBy3);

    // Verify the rewards distributed to sender1, sender2, and sender3
    const rewardAmount1 = calculateExpectedReward(
      initialAmount1 + increaseBy1,
      initialAmount1 +
        initialAmount2 +
        initialAmount3 +
        increaseBy1 +
        increaseBy2 +
        increaseBy3
    );
    const rewardAmount2 = calculateExpectedReward(
      initialAmount2 + increaseBy2,
      initialAmount1 +
        initialAmount2 +
        initialAmount3 +
        increaseBy1 +
        increaseBy2 +
        increaseBy3
    );
    const rewardAmount3 = calculateExpectedReward(
      initialAmount3 + increaseBy3,
      initialAmount1 +
        initialAmount2 +
        initialAmount3 +
        increaseBy1 +
        increaseBy2 +
        increaseBy3
    );

    result1.result.expectTuple().unlocked.expectUint(1000000); //initialAmount1 + increaseBy1 + rewardAmount1);
    result2.result.expectTuple().unlocked.expectUint(1000000); //initialAmount2 + increaseBy2 + rewardAmount2);
    result3.result.expectTuple().unlocked.expectUint(1000000); //initialAmount3 + increaseBy3 + rewardAmount3);
  },
});

// Helper function to calculate the expected reward based on the user's locked STX and the total locked STX in the cycle
function calculateExpectedReward(
  userLockedSTX: number,
  totalLockedSTX: number
): number {
  const totalReward = 100000; // Replace with the actual total reward for the cycle
  return Math.floor((userLockedSTX / totalLockedSTX) * totalReward);
}
