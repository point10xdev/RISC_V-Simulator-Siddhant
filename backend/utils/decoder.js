/**
 * decoder.js
 * Minimal implementation to satisfy simulatorController.js requirements.
 * Since the parser already extracts the necessary fields (rd, rs1, imm, etc.),
 * this function serves as a simple pass-through to the executor.
 */

exports.decode = (instruction) => {
  // In a full implementation, complex binary decoding logic would be here.
  // For this project, the parsed instruction object is sufficient for the executor.
  return instruction;
};

module.exports = {
  decode: exports.decode
};