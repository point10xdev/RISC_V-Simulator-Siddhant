/**
 * executor.js
 * Delegates execution to type-specific instruction handlers.
 */

// Import all specific execution functions
const RType = require('./executor/rtype');
const IType = require('./executor/itype');
const LoadStore = require('./executor/load_store');
const BranchJump = require('./executor/branch_jump');
const UTypeSpecial = require('./executor/utype_special');

// Consolidate all execution functions into a map for easy lookup
const executionMap = {
  // R-Type
  'ADD': RType.executeADD, 'SUB': RType.executeSUB, 'SLL': RType.executeSLL, 
  'SLT': RType.executeSLT, 'SLTU': RType.executeSLTU, 'XOR': RType.executeXOR, 
  'SRL': RType.executeSRL, 'SRA': RType.executeSRA, 'OR': RType.executeOR, 
  'AND': RType.executeAND,
  
  // I-Type
  'ADDI': IType.executeADDI, 'SLTI': IType.executeSLTI, 'SLTIU': IType.executeSLTIU, 
  'XORI': IType.executeXORI, 'ORI': IType.executeORI, 'ANDI': IType.executeANDI, 
  'SLLI': IType.executeSLLI, 'SRLI': IType.executeSRLI, 'SRAI': IType.executeSRAI,

  // Load/Store
  'LB': LoadStore.executeLB, 'LH': LoadStore.executeLH, 'LW': LoadStore.executeLW,
  'LBU': LoadStore.executeLBU, 'LHU': LoadStore.executeLHU,
  'SB': LoadStore.executeSB, 'SH': LoadStore.executeSH, 'SW': LoadStore.executeSW,

  // Branch/Jump
  'BEQ': BranchJump.executeBEQ, 'BNE': BranchJump.executeBNE, 'BLT': BranchJump.executeBLT, 
  'BGE': BranchJump.executeBGE, 'BLTU': BranchJump.executeBLTU, 'BGEU': BranchJump.executeBGEU,
  'JAL': BranchJump.executeJAL, 'JALR': BranchJump.executeJALR,

  // U-Type and Special
  'LUI': UTypeSpecial.executeLUI, 'AUIPC': UTypeSpecial.executeAUIPC,
  'HLT': UTypeSpecial.executeHLT
};

class Executor {
  /**
   * Execute a decoded instruction by delegating to the appropriate handler.
   * @param {Object} decoded - Decoded instruction
   * @param {Object} sim - Simulator instance (or mock interface)
   */
  execute(decoded, sim) {
    const handler = executionMap[decoded.opcode];
    if (handler) {
      handler(decoded, sim);
    } else {
      throw new Error(`Execution not implemented for: ${decoded.opcode}`);
    }
  }
}

module.exports = {
  execute: (decoded, sim) => {
    const executor = new Executor();
    return executor.execute(decoded, sim);
  },
  Executor
};