/**
 * executor/itype.js
 * Executes I-Format (Arithmetic/Logical) instructions (ADDI, XORI, SLLI, etc.)
 */

exports.executeADDI = (decoded, sim) => {
  const rs1Val = sim.getRegister(decoded.rs1);
  const result = (rs1Val + decoded.imm) | 0;
  sim.setRegister(decoded.rd, result);
  sim.incrementPC();
};

exports.executeSLTI = (decoded, sim) => {
  const rs1Val = sim.getRegister(decoded.rs1);
  const result = rs1Val < decoded.imm ? 1 : 0;
  sim.setRegister(decoded.rd, result);
  sim.incrementPC();
};

exports.executeSLTIU = (decoded, sim) => {
  const rs1Val = sim.getRegister(decoded.rs1) >>> 0;
  const imm = decoded.imm >>> 0;
  const result = rs1Val < imm ? 1 : 0;
  sim.setRegister(decoded.rd, result);
  sim.incrementPC();
};

exports.executeXORI = (decoded, sim) => {
  const rs1Val = sim.getRegister(decoded.rs1);
  const result = (rs1Val ^ decoded.imm) | 0;
  sim.setRegister(decoded.rd, result);
  sim.incrementPC();
};

exports.executeORI = (decoded, sim) => {
  const rs1Val = sim.getRegister(decoded.rs1);
  const result = (rs1Val | decoded.imm) | 0;
  sim.setRegister(decoded.rd, result);
  sim.incrementPC();
};

exports.executeANDI = (decoded, sim) => {
  const rs1Val = sim.getRegister(decoded.rs1);
  const result = (rs1Val & decoded.imm) | 0;
  sim.setRegister(decoded.rd, result);
  sim.incrementPC();
};

exports.executeSLLI = (decoded, sim) => {
  const rs1Val = sim.getRegister(decoded.rs1);
  const shamt = decoded.shamt || (decoded.imm & 0x1F);
  const result = (rs1Val << shamt) | 0;
  sim.setRegister(decoded.rd, result);
  sim.incrementPC();
};

exports.executeSRLI = (decoded, sim) => {
  const rs1Val = sim.getRegister(decoded.rs1) >>> 0;
  const shamt = decoded.shamt || (decoded.imm & 0x1F);
  const result = (rs1Val >>> shamt) | 0;
  sim.setRegister(decoded.rd, result);
  sim.incrementPC();
};

exports.executeSRAI = (decoded, sim) => {
  const rs1Val = sim.getRegister(decoded.rs1);
  const shamt = decoded.shamt || (decoded.imm & 0x1F);
  const result = (rs1Val >> shamt) | 0;
  sim.setRegister(decoded.rd, result);
  sim.incrementPC();
};