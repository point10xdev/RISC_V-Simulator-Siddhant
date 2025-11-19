/**
 * Simulator.js
 * Core simulator model for RISC-V 32-bit processor
 * Maintains the state of registers, memory, and PC
 */

class Simulator {
  constructor() {
    // 32 General Purpose Registers (x0 to x31)
    // x0 is hardwired to 0
    this.registers = new Array(32).fill(0);
    
    // Memory - 1MB (1024 * 1024 bytes)
    // Using ArrayBuffer for efficient byte-level operations
    this.memory = new ArrayBuffer(1024 * 1024);
    this.memoryView = new DataView(this.memory);
    
    // Program Counter
    this.pc = 0;
    
    // Instruction memory (stores parsed instructions)
    this.instructions = [];
    
    // Execution state
    this.halted = false;
    this.cycleCount = 0;
    
    // Instruction history for debugging
    this.executionHistory = [];
  }

  /**
   * Reset the simulator to initial state
   */
  reset() {
    this.registers = new Array(32).fill(0);
    this.memory = new ArrayBuffer(1024 * 1024);
    this.memoryView = new DataView(this.memory);
    this.pc = 0;
    this.instructions = [];
    this.halted = false;
    this.cycleCount = 0;
    this.executionHistory = [];
  }

  /**
   * Get register value
   * @param {number} reg - Register number (0-31)
   * @returns {number} Register value
   */
  getRegister(reg) {
    if (reg < 0 || reg > 31) {
      throw new Error(`Invalid register: x${reg}`);
    }
    // x0 is always 0
    return reg === 0 ? 0 : this.registers[reg];
  }

  /**
   * Set register value
   * @param {number} reg - Register number (0-31)
   * @param {number} value - Value to set
   */
  setRegister(reg, value) {
    if (reg < 0 || reg > 31) {
      throw new Error(`Invalid register: x${reg}`);
    }
    // x0 cannot be written to
    if (reg !== 0) {
      // Ensure 32-bit signed integer
      this.registers[reg] = value | 0;
    }
  }

  /**
   * Read byte from memory
   * @param {number} address - Memory address
   * @returns {number} Byte value
   */
  readByte(address) {
    this.validateAddress(address);
    return this.memoryView.getUint8(address);
  }

  /**
   * Read byte from memory (unsigned)
   * @param {number} address - Memory address
   * @returns {number} Unsigned byte value
   */
  readByteUnsigned(address) {
    this.validateAddress(address);
    return this.memoryView.getUint8(address);
  }

  /**
   * Read half-word (2 bytes) from memory
   * @param {number} address - Memory address
   * @returns {number} Half-word value (signed)
   */
  readHalfWord(address) {
    this.validateAddress(address, 2);
    return this.memoryView.getInt16(address, true); // true = little-endian
  }

  /**
   * Read half-word (2 bytes) from memory (unsigned)
   * @param {number} address - Memory address
   * @returns {number} Half-word value (unsigned)
   */
  readHalfWordUnsigned(address) {
    this.validateAddress(address, 2);
    return this.memoryView.getUint16(address, true);
  }

  /**
   * Read word (4 bytes) from memory
   * @param {number} address - Memory address
   * @returns {number} Word value
   */
  readWord(address) {
    this.validateAddress(address, 4);
    return this.memoryView.getInt32(address, true);
  }

  /**
   * Write byte to memory
   * @param {number} address - Memory address
   * @param {number} value - Byte value
   */
  writeByte(address, value) {
    this.validateAddress(address);
    this.memoryView.setUint8(address, value & 0xFF);
  }

  /**
   * Write half-word (2 bytes) to memory
   * @param {number} address - Memory address
   * @param {number} value - Half-word value
   */
  writeHalfWord(address, value) {
    this.validateAddress(address, 2);
    this.memoryView.setInt16(address, value & 0xFFFF, true);
  }

  /**
   * Write word (4 bytes) to memory
   * @param {number} address - Memory address
   * @param {number} value - Word value
   */
  writeWord(address, value) {
    this.validateAddress(address, 4);
    this.memoryView.setInt32(address, value | 0, true);
  }

  /**
   * Validate memory address
   * @param {number} address - Memory address
   * @param {number} size - Access size in bytes
   */
  validateAddress(address, size = 1) {
    if (address < 0 || address + size > this.memory.byteLength) {
      throw new Error(`Memory access violation at address 0x${address.toString(16)}`);
    }
    // Check alignment for half-word and word accesses
    if (size === 2 && address % 2 !== 0) {
      throw new Error(`Unaligned half-word access at address 0x${address.toString(16)}`);
    }
    if (size === 4 && address % 4 !== 0) {
      throw new Error(`Unaligned word access at address 0x${address.toString(16)}`);
    }
  }

  /**
   * Load instructions into instruction memory
   * @param {Array} instructions - Array of parsed instructions
   */
  loadInstructions(instructions) {
    this.instructions = instructions;
    this.pc = 0;
    this.halted = false;
  }

  /**
   * Fetch current instruction
   * @returns {Object} Current instruction
   */
  fetchInstruction() {
    if (this.pc < 0 || this.pc >= this.instructions.length) {
      this.halted = true;
      return null;
    }
    return this.instructions[this.pc];
  }

  /**
   * Increment program counter
   */
  incrementPC() {
    this.pc++;
  }

  /**
   * Set program counter
   * @param {number} value - New PC value
   */
  setPC(value) {
    this.pc = value;
  }

  /**
   * Halt the simulator
   */
  halt() {
    this.halted = true;
  }

  /**
   * Check if simulator is halted
   * @returns {boolean} Halted state
   */
  isHalted() {
    return this.halted;
  }

  /**
   * Add instruction to execution history
   * @param {Object} instruction - Executed instruction
   * @param {number} pc - PC value when executed
   */
  addToHistory(instruction, pc) {
    this.executionHistory.push({
      pc,
      instruction,
      cycleCount: this.cycleCount
    });
    this.cycleCount++;
  }

  /**
   * Get current state for serialization
   * @returns {Object} Current simulator state
   */
  getState() {
    // Get non-zero memory locations for efficiency
    const nonZeroMemory = [];
    for (let i = 0; i < Math.min(this.memory.byteLength, 1024); i++) {
      const value = this.memoryView.getUint8(i);
      if (value !== 0 || i < 256) { // Always include first 256 bytes
        nonZeroMemory.push({ address: i, value });
      }
    }

    return {
      registers: [...this.registers],
      memory: nonZeroMemory,
      pc: this.pc,
      halted: this.halted,
      cycleCount: this.cycleCount,
      executionHistory: this.executionHistory.slice(-10) // Last 10 instructions
    };
  }

  /**
   * Set state from serialized data
   * @param {Object} state - Serialized state
   */
  setState(state) {
    if (state.registers) {
      this.registers = [...state.registers];
    }
    if (state.memory) {
      state.memory.forEach(({ address, value }) => {
        this.memoryView.setUint8(address, value);
      });
    }
    if (state.pc !== undefined) {
      this.pc = state.pc;
    }
    if (state.halted !== undefined) {
      this.halted = state.halted;
    }
    if (state.cycleCount !== undefined) {
      this.cycleCount = state.cycleCount;
    }
    if (state.executionHistory) {
      this.executionHistory = state.executionHistory;
    }
  }

  /**
   * Sign extend a value
   * @param {number} value - Value to sign extend
   * @param {number} bits - Number of bits in original value
   * @returns {number} Sign-extended value
   */
  static signExtend(value, bits) {
    const shift = 32 - bits;
    return (value << shift) >> shift;
  }

  /**
   * Convert value to unsigned 32-bit
   * @param {number} value - Signed value
   * @returns {number} Unsigned value
   */
  static toUnsigned(value) {
    return value >>> 0;
  }

  /**
   * Get register name
   * @param {number} reg - Register number
   * @returns {string} Register name
   */
  static getRegisterName(reg) {
    const names = [
      'zero', 'ra', 'sp', 'gp', 'tp', 't0', 't1', 't2',
      's0/fp', 's1', 'a0', 'a1', 'a2', 'a3', 'a4', 'a5',
      'a6', 'a7', 's2', 's3', 's4', 's5', 's6', 's7',
      's8', 's9', 's10', 's11', 't3', 't4', 't5', 't6'
    ];
    return `x${reg} (${names[reg]})`;
  }
}

module.exports = Simulator;