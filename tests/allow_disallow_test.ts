import { assertEquals } from "https://deno.land/std@0.90.0/testing/asserts.ts";
import {
  Account,
  Contract,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet@v1.5.4/index.ts";
/*
Clarinet.test({
  name: "Test allowing and disallowing contract callers with intermediary contract",
  async fn(chain: Chain, accounts: Map<string, Account>, contracts: Map<string, Contract>) {
    const deployer = accounts.get("deployer")!;
    const contractCaller = accounts.get("wallet_1")!;
    const user = accounts.get("wallet_2")!;
    const intermediary = contracts.get("intermediary")!;
    const pox2 = contracts.get("pox-3")!;
    
    /*
    // Deploy the intermediary contract
    const intermediary = `
      (define-public (call-check-caller-allowed (pox-3 principal))
        (contract-call? pox-3 check-caller-allowed)
      )
    `;
    chain.deployContract(
      "intermediary",
      intermediary,
      deployer.address
    );
    

    // Test 1: Check that the contract caller is allowed when tx-sender == contract-caller
    let allowed = chain.callReadOnlyFn(
      "pox-3",
      "check-caller-allowed",
      [],
      deployer.address
    );
    allowed.result.expectBool(true);

    // Test 2: Allow contract caller and check allowance
    const allowBlock = chain.mineBlock([
      Tx.contractCall(
        "pox-3",
        "allow-contract-caller",
        [types.principal(contractCaller.address), types.some(types.uint(200))],
        deployer.address
      ),
    ]);
    allowBlock.receipts[0].result.expectOk();

    // Check the allowance
    const allowance = chain.callReadOnlyFn(
      "pox-3",
      "get-allowance-contract-callers",
      [types.principal(deployer.address), types.principal(contractCaller.address)],
      deployer.address
    );
    allowance.result.expectSome().expectTuple().untilBurnHt.expectUint(200);

    // Test 3: Check that the contract caller is now allowed
    allowed = chain.callReadOnlyFn(
      "pox-3",
      "call-check-caller-allowed",
      [types.principal(pox2.address)],
      contractCaller.address
    );
    assertEquals(allowed.result.expectBool(), true);

    // Test 4: Check that the contract caller is not allowed when until-burn-ht is expired
    chain.mineEmptyBlock(201); // Expire the until-burn-ht
    allowed = chain.callReadOnlyFn(
      "intermediary",
      "call-check-caller-allowed",
      [types.principal(pox2.address)],
      contractCaller.address
    );
    assertEquals(allowed.result.expectBool(), false);

    // Test 5: Disallow contract caller and check that the allowance is removed
    const disallowBlock = chain.mineBlock([
      Tx.contractCall(
        "pox-3",
        "disallow-contract-caller",
        [types.principal(contractCaller.address)],
        deployer.address
      ),
    ]);
    disallowBlock.receipts[0].result.expectOk();

    // Check the allowance
    const removedAllowance = chain.callReadOnlyFn(
      "pox-3",
      "get-allowance-contract-callers",
      [types.principal(deployer.address), types.principal(contractCaller.address)],
      deployer.address
    );
    removedAllowance.result.expectNone();

    // Test 6: Check that the contract caller is now disallowed
    allowed = chain.callReadOnlyFn(
      "intermediary",
      "call-check-caller-allowed",
      [types.principal(pox2.address)],
      contractCaller.address
    );
    assertEquals(allowed.result.expectBool(), false);

    // Test 7: Allow contract caller with no expiry
    const allowNoExpiryBlock = chain.mineBlock([
      Tx.contractCall(
        "pox-3",
        "allow-contract-caller",
        [types.principal(contractCaller.address), types.none()],
        deployer.address
      ),
    ]);
    allowNoExpiryBlock.receipts[0].result.expectOk();

    // Check the allowance
    const noExpiryAllowance = chain.callReadOnlyFn(
      "pox-3",
      "get-allowance-contract-callers",
      [types.principal(deployer.address), types.principal(contractCaller.address)],
      deployer.address
    );
    noExpiryAllowance.result.expectSome().expectTuple().untilBurnHt.expectNone();

    // Test 8: Check that the contract caller is allowed with no expiry
    allowed = chain.callReadOnlyFn(
      "intermediary",
      "call-check-caller-allowed",
      [types.principal(pox2.address)],
      contractCaller.address
    );
    assertEquals(allowed.result.expectBool(), true);

  },
});
*/
