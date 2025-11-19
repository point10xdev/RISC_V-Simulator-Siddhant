/**
 * executor/rtype.js
 * Executes R-Format (Register-Register) instructions.
 */

exports.executeADD = (decoded, sim) => {
  const rs1Val = sim.getRegister(decoded.rs1);
  const rs2Val = sim.getRegister(decoded.rs2);
  const result = (rs1Val + rs2Val) | 0; // Force 32-bit signed
  sim.setRegister(decoded.rd, result);
  sim.incrementPC();
};

exports.executeSUB = (decoded, sim) => {
  const rs1Val = sim.getRegister(decoded.rs1);
  const rs2Val = sim.getRegister(decoded.rs2);
  const result = (rs1Val - rs2Val) | 0;
  sim.setRegister(decoded.rd, result);
  sim.incrementPC();
};

exports.executeSLL = (decoded, sim) => {
  const rs1Val = sim.getRegister(decoded.rs1);
  const rs2Val = sim.getRegister(decoded.rs2);
  const shamt = rs2Val & 0x1F; // Only lower 5 bits for 32-bit RISC-V
  const result = (rs1Val << shamt) | 0;
  sim.setRegister(decoded.rd, result);
  sim.incrementPC();
};

exports.executeSLT = (decoded, sim) => {
  const rs1Val = sim.getRegister(decoded.rs1);
  const rs2Val = sim.getRegister(decoded.rs2);
  const result = rs1Val < rs2Val ? 1 : 0;
  sim.setRegister(decoded.rd, result);
  sim.incrementPC();
};

exports.executeSLTU = (decoded, sim) => {
  const rs1Val = sim.getRegister(decoded.rs1) >>> 0; // Unsigned
  const rs2Val = sim.getRegister(decoded.rs2) >>> 0; // Unsigned
  const result = rs1Val < rs2Val ? 1 : 0;
  sim.setRegister(decoded.rd, result);
  sim.incrementPC();
};

exports.executeXOR = (decoded, sim) => {
  const rs1Val = sim.getRegister(decoded.rs1);
  const rs2Val = sim.getRegister(decoded.rs2);
  const result = (rs1Val ^ rs2Val) | 0;
  sim.setRegister(decoded.rd, result);
  sim.incrementPC();
};

exports.executeSRL = (decoded, sim) => {
  const rs1Val = sim.getRegister(decoded.rs1) >>> 0; // Logical Shift: Unsigned
  const rs2Val = sim.getRegister(decoded.rs2);
  const shamt = rs2Val & 0x1F;
  const result = (rs1Val >>> shamt) | 0;
  sim.setRegister(decoded.rd, result);
  sim.incrementPC();
};

exports.executeSRA = (decoded, sim) => {
  const rs1Val = sim.getRegister(decoded.rs1);
  const rs2Val = sim.getRegister(decoded.rs2);
  const shamt = rs2Val & 0x1F;
  const result = (rs1Val >> shamt) | 0; // Arithmetic Shift: Signed
  sim.setRegister(decoded.rd, result);
  sim.incrementPC();
};

exports.executeOR = (decoded, sim) => {
  const rs1Val = sim.getRegister(decoded.rs1);
  const rs2Val = sim.getRegister(decoded.rs2);
  const result = (rs1Val | rs2Val) | 0;
  sim.setRegister(decoded.rd, result);
  sim.incrementPC();
};

exports.executeAND = (decoded, sim) => {
  const rs1Val = sim.getRegister(decoded.rs1);
  const rs2Val = sim.getRegister(decoded.rs2);
  const result = (rs1Val & rs2Val) | 0;
  sim.setRegister(decoded.rd, result);
  sim.incrementPC();
};