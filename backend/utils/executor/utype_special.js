/**
 * executor/utype_special.js
 * Executes U-Format (Upper Immediate) and Special instructions (LUI, AUIPC, HLT).
 */

exports.executeLUI = (decoded, sim) => {
  // LUI: Load upper immediate
  // rd = imm (already shifted left by 12 in decoder)
  sim.setRegister(decoded.rd, decoded.imm);
  sim.incrementPC();
};

exports.executeAUIPC = (decoded, sim) => {
  // AUIPC: Add upper immediate to PC
  // rd = PC + imm (imm already shifted left by 12)
  // PC is in instruction count, convert to byte address (PC * 4)
  const pcBytes = (sim.pc || 0) * 4;
  const result = (pcBytes + decoded.imm) | 0;
  sim.setRegister(decoded.rd, result);
  sim.incrementPC();
};

exports.executeHLT = (decoded, sim) => {
  sim.halt();
  // Don't increment PC on halt
};