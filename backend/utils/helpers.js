/**
 * helpers.js
 * Generic utility functions for parsing, decoding, and execution
 */
const { registerMap } = require('./isa');

/**
 * Parse register name to register number
 * @param {string} reg - Register name
 * @returns {number} Register number
 */
exports.parseRegister = (reg) => {
  const regLower = reg.toLowerCase();
  
  if (registerMap.hasOwnProperty(regLower)) {
    return registerMap[regLower];
  }
  
  throw new Error(`Invalid register: ${reg}`);
};

/**
 * Parse immediate value
 * @param {string} imm - Immediate string
 * @param {number} bits - Number of bits for immediate
 * @returns {number} Parsed immediate value
 */
exports.parseImmediate = (imm, bits) => {
  let value;
  
  // Handle different number formats
  if (imm.startsWith('0x') || imm.startsWith('0X')) {
    // Hexadecimal
    value = parseInt(imm, 16);
  } else if (imm.startsWith('0b') || imm.startsWith('0B')) {
    // Binary
    value = parseInt(imm.substring(2), 2);
  } else {
    // Decimal (handles negative)
    value = parseInt(imm, 10);
  }
  
  if (isNaN(value)) {
    throw new Error(`Invalid immediate value: ${imm}`);
  }
  
  // Check if value fits in the specified number of bits (Signed range check)
  const maxValue = (1 << (bits - 1)) - 1;
  const minValue = -(1 << (bits - 1));
  
  if (value > maxValue || value < minValue) {
    throw new Error(`Immediate value ${value} does not fit in ${bits} bits (range: ${minValue} to ${maxValue})`);
  }
  
  return value;
};

/**
 * Sign extend a value to 32 bits
 * @param {number} value - Value to sign extend
 * @param {number} bits - Number of bits in original value
 * @returns {number} Sign-extended 32-bit value
 */
exports.signExtend = (value, bits) => {
  const signBit = 1 << (bits - 1);
  
  // Check if sign bit is set
  if (value & signBit) {
    // Extend with 1s
    const mask = (-1 << bits);
    return value | mask;
  } else {
    // Mask to ensure correct size if positive
    const mask = (1 << bits) - 1;
    return value & mask;
  }
};

/**
 * Validate register number
 * @param {number} reg - Register number
 * @param {string} name - Register name for error messages
 */
exports.validateRegister = (reg, name) => {
  if (reg < 0 || reg > 31) {
    throw new Error(`Invalid register ${name}: x${reg} (must be x0-x31)`);
  }
};