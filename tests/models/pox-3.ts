import {
    Account,
    Chain,
    Clarinet,
    Tx,
    types,
  } from "https://deno.land/x/clarinet@v1.2.0/index.ts";
  
  // Provide some common constants and contract calls here to simplify writing test cases
  class Pox3 {
    // Constants
    // These must match what is defined in pox-3.clar
    public static readonly MIN_POX_REWARD_CYCLES = 1;
    public static readonly MAX_POX_REWARD_CYCLES = 12;
    public static readonly PREPARE_CYCLE_LENGTH = 100;
    public static readonly REWARD_CYCLE_LENGTH = 2100;
    public static readonly ADDRESS_VERSION_P2PKH = 0x00;
    public static readonly ADDRESS_VERSION_P2SH = 0x01;
    public static readonly ADDRESS_VERSION_P2WPKH = 0x02;
    public static readonly ADDRESS_VERSION_P2WSH = 0x03;
    public static readonly STACKING_THRESHOLD_25 = 20000;
    public static readonly STACKING_THRESHOLD_100 = 5000;
    public static readonly ERR_STACKING_UNREACHABLE = 255;
    public static readonly ERR_STACKING_CORRUPTED_STATE = 254;
    public static readonly ERR_STACKING_INSUFFICIENT_FUNDS = 1;
    public static readonly ERR_STACKING_INVALID_LOCK_PERIOD = 2;
    public static readonly ERR_STACKING_ALREADY_STACKED = 3;
    public static readonly ERR_STACKING_NO_SUCH_PRINCIPAL = 4;
    public static readonly ERR_STACKING_EXPIRED = 5;
    public static readonly ERR_STACKING_STX_LOCKED = 6;
    public static readonly ERR_STACKING_PERMISSION_DENIED = 9;
    public static readonly ERR_STACKING_THRESHOLD_NOT_MET = 11;
    public static readonly ERR_STACKING_POX_ADDRESS_IN_USE = 12;
    public static readonly ERR_STACKING_INVALID_POX_ADDRESS = 13;
    public static readonly ERR_STACKING_ALREADY_REJECTED = 17;
    public static readonly ERR_STACKING_INVALID_AMOUNT = 18;
    public static readonly ERR_NOT_ALLOWED = 19;
    public static readonly ERR_STACKING_ALREADY_DELEGATED = 20;
    public static readonly ERR_DELEGATION_EXPIRES_DURING_LOCK = 21;
    public static readonly ERR_DELEGATION_TOO_MUCH_LOCKED = 22;
    public static readonly ERR_DELEGATION_POX_ADDR_REQUIRED = 23;
    public static readonly ERR_INVALID_START_BURN_HEIGHT = 24;
    public static readonly ERR_NOT_CURRENT_STACKER = 25;
    public static readonly ERR_STACK_EXTEND_NOT_LOCKED = 26;
    public static readonly ERR_STACK_INCREASE_NOT_LOCKED = 27;
    public static readonly ERR_DELEGATION_NO_REWARD_SLOT = 28;
    public static readonly ERR_DELEGATION_WRONG_REWARD_SLOT = 29;
    public static readonly ERR_STACKING_IS_DELEGATED = 30;
    public static readonly ERR_STACKING_NOT_DELEGATED = 31;

    chain: Chain;
    deployer: Account;
  
    constructor(chain: Chain, deployer: Account) {
      this.chain = chain;
      this.deployer = deployer;
    }
  
    // NOTE: `stx-account` function doesn't seem to work with current (1.5.4) version of Clarinet
    //        Use `stx-locked-from-pox-data` instead
    stxLockedFromPoxData(accountAddress: string) {
      return this.chain.callReadOnlyFn(
        "pox-3",
        "stx-locked-from-pox-data",
        [
            types.principal(accountAddress)
        ],
        this.deployer.address
      );
    }

    // NOTE: `stx-account` function doesn't seem to work with current (1.5.4) version of Clarinet
    //        Use `stx-locked-from-pox-data` instead
    stxAccountFromPoxData(accountAddress: string) {
      return this.chain.callReadOnlyFn(
        "pox-3",
        "stx-account-from-pox-data",
        [
            types.principal(accountAddress)
        ],
        this.deployer.address
      );
    }

    currentPoxRewardCycle() {
      return this.chain.callReadOnlyFn(
        "pox-3",
        "current-pox-reward-cycle",
        [],
        this.deployer.address
      );
    }

    // Advance by # of blocks in full (prepare + reward) cycle
    advanceByFullCycle() {
      return this.chain.mineEmptyBlockUntil(
        this.chain.blockHeight + Pox3.PREPARE_CYCLE_LENGTH + Pox3.REWARD_CYCLE_LENGTH
      );
    }
  }  

  export { Pox3 };