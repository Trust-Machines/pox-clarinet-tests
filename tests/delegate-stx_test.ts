import { assertEquals } from "https://deno.land/std@0.90.0/testing/asserts.ts";
import {
    Account,
    Chain,
    Clarinet,
    Tx,
    types,
} from "https://deno.land/x/clarinet@v1.5.4/index.ts";

Clarinet.test({
    name: "pox-3: Test delegate-stx and revoke-delegate-stx",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get("deployer")!;
        const wallet_1 = accounts.get("wallet_1")!;
        const wallet_2 = accounts.get("wallet_2")!;

        // Set burnchain parameters
        const setBurnParams = chain.mineBlock([
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

        assertEquals(setBurnParams.receipts.length, 1);
        setBurnParams.receipts[0].result.expectOk().expectBool(true);

        // Test delegate-stx
        const delegateBlock = chain.mineBlock([
            Tx.contractCall(
                "pox-3",
                "delegate-stx",
                [
                    types.uint(80_000_000_000_000),
                    types.principal(wallet_2.address),
                    types.none(),
                    types.none()
                ],
                wallet_1.address
            ),
        ]);

        assertEquals(delegateBlock.receipts.length, 1);
        delegateBlock.receipts[0].result.expectOk();

        // Test revoke-delegate-stx
        const revokeBlock = chain.mineBlock([
            Tx.contractCall(
                "pox-3",
                "revoke-delegate-stx",
                [],
                wallet_1.address
            ),
        ]);

        assertEquals(revokeBlock.receipts.length, 1);
        revokeBlock.receipts[0].result.expectOk().expectBool(true);
    },
});

// Test delegate-stx with locked STX and then revoking it
Clarinet.test({
    name: "pox-3: Test delegate-stx with locked STX and then revoke-delegate-stx",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get("deployer")!;
        const wallet_1 = accounts.get("wallet_1")!;
        const wallet_2 = accounts.get("wallet_2")!;

        // Set burnchain parameters
        const setBurnParams = chain.mineBlock([
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

        assertEquals(setBurnParams.receipts.length, 1);
        setBurnParams.receipts[0].result.expectOk().expectBool(true);

        // Test delegate-stx
        const delegateBlock = chain.mineBlock([
            Tx.contractCall(
                "pox-3",
                "delegate-stx",
                [
                    types.uint(80000000000000),
                    types.principal(wallet_2.address),
                    types.none(),
                    types.none()
                ],
                wallet_1.address
            ),
        ]);

        assertEquals(delegateBlock.receipts.length, 1);
        delegateBlock.receipts[0].result.expectOk();

        // Check delegation status
        let result = chain.callReadOnlyFn("pox-3", "get-delegation-info", [types.principal(wallet_1.address)], wallet_1.address);
        let resultTuple = result.result.expectSome().expectTuple();
        assertEquals( Number(resultTuple["amount-ustx"].replace(/[^0-9\.]+/g,"")), 80000000000000);
        assertEquals( resultTuple["delegated-to"], wallet_2.address);

        // Test revoke-delegate-stx
        const revokeBlock = chain.mineBlock([
            Tx.contractCall(
                "pox-3",
                "revoke-delegate-stx",
                [],
                wallet_1.address
            ),
        ]);

        assertEquals(revokeBlock.receipts.length, 1);
        revokeBlock.receipts[0].result.expectOk().expectBool(true);

        // Check delegation status after revoking
        result = chain.callReadOnlyFn("pox-3", "get-delegation-info", [types.principal(wallet_1.address)], wallet_1.address);
        resultTuple = result.result.expectNone();
    },
});

// Test delegate-stx with insufficient unlocked STX
Clarinet.test({
    name: "pox-3: Test delegate-stx with insufficient unlocked STX",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get("deployer")!;
        const wallet_1 = accounts.get("wallet_1")!;
        const wallet_2 = accounts.get("wallet_2")!;
        // Set burnchain parameters
        const setBurnParams = chain.mineBlock([
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

        assertEquals(setBurnParams.receipts.length, 1);
        setBurnParams.receipts[0].result.expectOk().expectBool(true);

        // Test delegate-stx with insufficient unlocked STX
        const delegateBlock = chain.mineBlock([
            Tx.contractCall(
                "pox-3",
                "delegate-stx",
                [
                    types.uint(2_000_000_000_000_000),
                    types.principal(wallet_2.address),
                    types.none(),
                    types.none()
                ],
                wallet_1.address
            ),
        ]);

        // delegation is fine because is an allowance, it can be greater than the balance
        assertEquals(delegateBlock.receipts.length, 1);
        delegateBlock.receipts[0].result.expectOk(); //Err().expectUint(17); // ERR_DELEGATE_STX_INSUFFICIENT_STX

        // Check delegation status - it should not be delegated
        let result = chain.callReadOnlyFn("pox-3", "get-check-delegation", [types.principal(wallet_1.address)], wallet_1.address);
        //result.expectNone();

    },
});

// Test delegate-stx with unlocked STX and then revoking it
Clarinet.test({
    name: "pox-3: Test delegate-stx with unlocked STX and then revoke-delegate-stx",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get("deployer")!;
        const wallet_1 = accounts.get("wallet_1")!;
        const wallet_2 = accounts.get("wallet_2")!;

        // Set burnchain parameters
        const setBurnParams = chain.mineBlock([
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

        assertEquals(setBurnParams.receipts.length, 1);
        setBurnParams.receipts[0].result.expectOk().expectBool(true);

        // Test delegate-stx with unlocked STX
        const delegateBlock = chain.mineBlock([
            Tx.contractCall(
                "pox-3",
                "delegate-stx",
                [
                    types.uint(500_000_000_000_000),
                    types.principal(wallet_2.address),
                    types.none(),
                    types.none()
                ],
                wallet_1.address
            ),
        ]);

        assertEquals(delegateBlock.receipts.length, 1);
        delegateBlock.receipts[0].result.expectOk();

        // Check delegation status
        let result = chain.callReadOnlyFn("pox-3", "get-delegation-info", [types.principal(wallet_1.address)], wallet_1.address);
        let resultTuple = result.result.expectSome().expectTuple();
        assertEquals( Number(resultTuple["amount-ustx"].replace(/[^0-9\.]+/g,"")), 500_000_000_000_000);
        assertEquals( resultTuple["delegated-to"], wallet_2.address);

        // Test revoke-delegate-stx
        const revokeBlock = chain.mineBlock([
            Tx.contractCall(
                "pox-3",
                "revoke-delegate-stx",
                [],
                wallet_1.address
            ),
        ]);

        assertEquals(revokeBlock.receipts.length, 1);
        revokeBlock.receipts[0].result.expectOk().expectBool(true);

        // Check delegation status after revoking
        // Unlocked STX should be back to the wallet, but that is outside of the contract in the node
        result = chain.callReadOnlyFn("pox-3", "get-check-delegation", [types.principal(wallet_1.address)], wallet_1.address);
        result.result.expectNone();
    },
});  
