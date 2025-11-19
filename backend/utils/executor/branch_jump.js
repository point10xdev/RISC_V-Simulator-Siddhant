/**
 * executor/branch_jump.js
 * Executes Branch (SB-Format) and Jump (UJ/JALR) instructions.
 */

exports.executeBEQ = (decoded, sim) => {
  const rs1Val = sim.getRegister(decoded.rs1);
  const rs2Val = sim.getRegister(decoded.rs2);
  if (rs1Val === rs2Val) {
    const offset = Math.floor(decoded.imm / 4); // Convert byte offset to instruction index offset
    sim.setPC((sim.pc || 0) + offset);
  } else {
    sim.incrementPC();
  }
};

exports.executeBNE = (decoded, sim) => {
  const rs1Val = sim.getRegister(decoded.rs1);
  const rs2Val = sim.getRegister(decoded.rs2);
  if (rs1Val !== rs2Val) {
    const offset = Math.floor(decoded.imm / 4);
    sim.setPC((sim.pc || 0) + offset);
  } else {
    sim.incrementPC();
  }
};

exports.executeBLT = (decoded, sim) => {
  const rs1Val = sim.getRegister(decoded.rs1);
  const rs2Val = sim.getRegister(decoded.rs2);
  if (rs1Val < rs2Val) {
    const offset = Math.floor(decoded.imm / 4);
    sim.setPC((sim.pc || 0) + offset);
  } else {
    sim.incrementPC();
  }
};

exports.executeBGE = (decoded, sim) => {
  const rs1Val = sim.getRegister(decoded.rs1);
  const rs2Val = sim.getRegister(decoded.rs2);
  if (rs1Val >= rs2Val) {
    const offset = Math.floor(decoded.imm / 4);
    sim.setPC((sim.pc || 0) + offset);
  } else {
    sim.incrementPC();
  }
};

exports.executeBLTU = (decoded, sim) => {
  const rs1Val = sim.getRegister(decoded.rs1) >>> 0;
  const rs2Val = sim.getRegister(decoded.rs2) >>> 0;
  if (rs1Val < rs2Val) {
    const offset = Math.floor(decoded.imm / 4);
    sim.setPC((sim.pc || 0) + offset);
  } else {
    sim.incrementPC();
  }
};

exports.executeBGEU = (decoded, sim) => {
  const rs1Val = sim.getRegister(decoded.rs1) >>> 0;
  const rs2Val = sim.getRegister(decoded.rs2) >>> 0;
  if (rs1Val >= rs2Val) {
    const offset = Math.floor(decoded.imm / 4);
    sim.setPC((sim.pc || 0) + offset);
  } else {
    sim.incrementPC();
  }
};

exports.executeJAL = (decoded, sim) => {
  // Save return address (PC + 1 in instruction count)
  const returnAddress = (sim.pc || 0) + 1;
  sim.setRegister(decoded.rd, returnAddress);
  
  // Jump: PC = PC + offset (offset is in bytes, convert to instruction count)
  const offset = Math.floor(decoded.imm / 4);
  sim.setPC((sim.pc || 0) + offset);
};

exports.executeJALR = (decoded, sim) => {
  const rs1Val = sim.getRegister(decoded.rs1);
  
  // Save return address (PC + 1)
  const returnAddress = (sim.pc || 0) + 1;
  
  // Calculate target address: (rs1 + immediate) & ~1. Then convert to instruction index.
  const targetByteAddress = (rs1Val + decoded.imm) & ~1;
  const targetPC = Math.floor(targetByteAddress / 4);
  
  // Set return address BEFORE jumping (in case rd == rs1)
  sim.setRegister(decoded.rd, returnAddress);
  sim.setPC(targetPC);
};