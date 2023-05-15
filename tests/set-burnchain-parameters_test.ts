import { assertEquals } from "https://deno.land/std@0.90.0/testing/asserts.ts";
import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet@v1.5.4/index.ts";

Clarinet.test({
  name: "set-burnchain-parameters: Can be called successfully for the first time",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;

    const block = chain.mineBlock([
      Tx.contractCall(
        "pox-3",
        "set-burnchain-parameters",
        [
          types.uint(100),
          types.uint(50),
          types.uint(200),
          types.uint(25),
          types.uint(500),
        ],
        deployer.address
      ),
    ]);

    assertEquals(block.receipts.length, 1);
    block.receipts[0].result.expectOk().expectBool(true);
  },
});

Clarinet.test({
  name: "set-burnchain-parameters: Cannot be called twice",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;

    chain.mineBlock([
      Tx.contractCall(
        "pox-3",
        "set-burnchain-parameters",
        [
          types.uint(100),
          types.uint(50),
          types.uint(200),
          types.uint(25),
          types.uint(500),
        ],
        deployer.address
      ),
    ]);

    const block = chain.mineBlock([
      Tx.contractCall(
        "pox-3",
        "set-burnchain-parameters",
        [
          types.uint(100),
          types.uint(50),
          types.uint(200),
          types.uint(25),
          types.uint(500),
        ],
        deployer.address
      ),
    ]);

    assertEquals(block.receipts.length, 1);
    let ERR_NOT_ALLOWED = 19;
    block.receipts[0].result.expectErr().expectInt(ERR_NOT_ALLOWED);
  },
});
