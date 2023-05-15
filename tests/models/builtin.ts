import {
    Account,
    Chain,
    Clarinet,
    Tx,
    types,
  } from "https://deno.land/x/clarinet@v1.2.0/index.ts";
  
  class BuiltIn {
    chain: Chain;
    deployer: Account;
  
    constructor(chain: Chain, deployer: Account) {
      this.chain = chain;
      this.deployer = deployer;
    }
  
    // NOTE: `stx-account` function doesn't seem to work with current (1.5.4) version of Clarinet
    //        Use `stx-account-from-pox-data` instead
    getSTXAccount(accountAddress: string) {
    // Readonly Contract call runtime error: builtin::get-stx-account('ST1J4G6RR643BCG8G8SR6M2D9Z9KXT2NJDRK3FBTK) 
    // -> Runtime Error: Runtime error while interpreting ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE.contract-call:
    // Unchecked(CostComputationFailed("Error evaluating result of cost function ST000000000000000000002AMW42H.costs.cost_stx_account:
    // Unchecked(UndefinedFunction(\"cost_stx_account\"))"))
      return this.chain.callReadOnlyFn("builtin", "get-stx-account", [
            types.principal(accountAddress)
      ], this.deployer.address);
    }
  }  

  export { BuiltIn };