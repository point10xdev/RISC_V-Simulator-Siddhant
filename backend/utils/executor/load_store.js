/**
 * executor/load_store.js
 * Executes Load (IL-Format) and Store (S-Format) instructions.
 */

exports.executeLB = (decoded, sim) => {
  const rs1Val = sim.getRegister(decoded.rs1);
  const address = (rs1Val + decoded.imm) | 0;
  const value = sim.readByte(address);
  sim.setRegister(decoded.rd, value);
  sim.incrementPC();
};

exports.executeLH = (decoded, sim) => {
  const rs1Val = sim.getRegister(decoded.rs1);
  const address = (rs1Val + decoded.imm) | 0;
  const value = sim.readHalfWord(address);
  sim.setRegister(decoded.rd, value);
  sim.incrementPC();
};

exports.executeLW = (decoded, sim) => {
  const rs1Val = sim.getRegister(decoded.rs1);
  const address = (rs1Val + decoded.imm) | 0;
  const value = sim.readWord(address);
  sim.setRegister(decoded.rd, value);
  sim.incrementPC();
};

exports.executeLBU = (decoded, sim) => {
  const rs1Val = sim.getRegister(decoded.rs1);
  const address = (rs1Val + decoded.imm) | 0;
  const value = sim.readByteUnsigned(address);
  sim.setRegister(decoded.rd, value);
  sim.incrementPC();
};

exports.executeLHU = (decoded, sim) => {
  const rs1Val = sim.getRegister(decoded.rs1);
  const address = (rs1Val + decoded.imm) | 0;
  const value = sim.readHalfWordUnsigned(address);
  sim.setRegister(decoded.rd, value);
  sim.incrementPC();
};

exports.executeSB = (decoded, sim) => {
  const rs1Val = sim.getRegister(decoded.rs1);
  const rs2Val = sim.getRegister(decoded.rs2);
  const address = (rs1Val + decoded.imm) | 0;
  sim.writeByte(address, rs2Val & 0xFF);
  sim.incrementPC();
};

exports.executeSH = (decoded, sim) => {
  const rs1Val = sim.getRegister(decoded.rs1);
  const rs2Val = sim.getRegister(decoded.rs2);
  const address = (rs1Val + decoded.imm) | 0;
  sim.writeHalfWord(address, rs2Val & 0xFFFF);
  sim.incrementPC();
};

exports.executeSW = (decoded, sim) => {
  const rs1Val = sim.getRegister(decoded.rs1);
  const rs2Val = sim.getRegister(decoded.rs2);
  const address = (rs1Val + decoded.imm) | 0;
  sim.writeWord(address, rs2Val);
  sim.incrementPC();
};