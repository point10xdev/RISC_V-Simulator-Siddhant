/**
 * decoder.js
 * Decodes parsed instruction objects into execution-ready format
 * Handles opcode identification and operand extraction for all RISC-V instruction formats
 */

class Decoder {
  constructor() {
    // Opcode definitions with funct3 and funct7 for precise identification
    this.opcodes = {
      // R-Format instructions
      'ADD': { type: 'R', funct3: 0b000, funct7: 0b0000000 },
      'SUB': { type: 'R', funct3: 0b000, funct7: 0b0100000 },
      'SLL': { type: 'R', funct3: 0b001, funct7: 0b0000000 },
      'SLT': { type: 'R', funct3: 0b010, funct7: 0b0000000 },
      'SLTU': { type: 'R', funct3: 0b011, funct7: 0b0000000 },
      'XOR': { type: 'R', funct3: 0b100, funct7: 0b0000000 },
      'SRL': { type: 'R', funct3: 0b101, funct7: 0b0000000 },
      'SRA': { type: 'R', funct3: 0b101, funct7: 0b0100000 },
      'OR': { type: 'R', funct3: 0b110, funct7: 0b0000000 },
      'AND': { type: 'R', funct3: 0b111, funct7: 0b0000000 },
      
      // I-Format (Arithmetic/Logical)
      'ADDI': { type: 'I', funct3: 0b000 },
      'SLTI': { type: 'I', funct3: 0b010 },
      'SLTIU': { type: 'I', funct3: 0b011 },
      'XORI': { type: 'I', funct3: 0b100 },
      'ORI': { type: 'I', funct3: 0b110 },
      'ANDI': { type: 'I', funct3: 0b111 },
      'SLLI': { type: 'I', funct3: 0b001, funct7: 0b0000000 },
      'SRLI': { type: 'I', funct3: 0b101, funct7: 0b0000000 },
      'SRAI': { type: 'I', funct3: 0b101, funct7: 0b0100000 },
      
      // I-Format (Load)
      'LB': { type: 'IL', funct3: 0b000 },
      'LH': { type: 'IL', funct3: 0b001 },
      'LW': { type: 'IL', funct3: 0b010 },
      'LBU': { type: 'IL', funct3: 0b100 },
      'LHU': { type: 'IL', funct3: 0b101 },
      
      // S-Format (Store)
      'SB': { type: 'S', funct3: 0b000 },
      'SH': { type: 'S', funct3: 0b001 },
      'SW': { type: 'S', funct3: 0b010 },
      
      // SB-Format (Branch)
      'BEQ': { type: 'SB', funct3: 0b000 },
      'BNE': { type: 'SB', funct3: 0b001 },
      'BLT': { type: 'SB', funct3: 0b100 },
      'BGE': { type: 'SB', funct3: 0b101 },
      'BLTU': { type: 'SB', funct3: 0b110 },
      'BGEU': { type: 'SB', funct3: 0b111 },
      
      // UJ-Format (Jump)
      'JAL': { type: 'UJ' },
      'JALR': { type: 'JALR', funct3: 0b000 },
      
      // U-Format
      'LUI': { type: 'U' },
      'AUIPC': { type: 'U' },
      
      // Special
      'HLT': { type: 'HLT' }
    };
  }

  /**
   * Decode a parsed instruction into execution format
   * @param {Object} instruction - Parsed instruction object
   * @returns {Object} Decoded instruction with all fields ready for execution
   */
  decode(instruction) {
    if (!instruction || !instruction.opcode) {
      throw new Error('Invalid instruction: missing opcode');
    }

    const opcode = instruction.opcode.toUpperCase();
    
    if (!this.opcodes[opcode]) {
      throw new Error(`Unknown opcode: ${opcode}`);
    }

    const opcodeInfo = this.opcodes[opcode];
    
    // Create base decoded instruction
    const decoded = {
      opcode: opcode,
      type: opcodeInfo.type,
      format: instruction.format,
      index: instruction.index,
      lineNum: instruction.lineNum,
      original: instruction.original
    };

    // Decode based on instruction type
    switch (opcodeInfo.type) {
      case 'R':
        return this.decodeRFormat(instruction, decoded);
      case 'I':
        return this.decodeIFormat(instruction, decoded);
      case 'IL':
        return this.decodeLoadFormat(instruction, decoded);
      case 'S':
        return this.decodeStoreFormat(instruction, decoded);
      case 'SB':
        return this.decodeBranchFormat(instruction, decoded);
      case 'UJ':
        return this.decodeJALFormat(instruction, decoded);
      case 'JALR':
        return this.decodeJALRFormat(instruction, decoded);
      case 'U':
        return this.decodeUFormat(instruction, decoded);
      case 'HLT':
        return decoded;
      default:
        throw new Error(`Unknown instruction type: ${opcodeInfo.type}`);
    }
  }

  /**
   * Decode R-Format instruction
   * Format: opcode rd, rs1, rs2
   */
  decodeRFormat(instruction, decoded) {
    if (instruction.rd === undefined || instruction.rs1 === undefined || instruction.rs2 === undefined) {
      throw new Error(`${instruction.opcode}: missing operands`);
    }

    decoded.rd = instruction.rd;
    decoded.rs1 = instruction.rs1;
    decoded.rs2 = instruction.rs2;
    
    // Validate register numbers
    this.validateRegister(decoded.rd, 'rd');
    this.validateRegister(decoded.rs1, 'rs1');
    this.validateRegister(decoded.rs2, 'rs2');

    return decoded;
  }

  /**
   * Decode I-Format instruction (Arithmetic/Logical)
   * Format: opcode rd, rs1, imm
   */
  decodeIFormat(instruction, decoded) {
    if (instruction.rd === undefined || instruction.rs1 === undefined || instruction.imm === undefined) {
      throw new Error(`${instruction.opcode}: missing operands`);
    }

    decoded.rd = instruction.rd;
    decoded.rs1 = instruction.rs1;
    decoded.imm = this.signExtend(instruction.imm, 12);
    
    // For shift instructions, immediate is only 5 bits (shamt)
    if (['SLLI', 'SRLI', 'SRAI'].includes(instruction.opcode)) {
      if (instruction.imm < 0 || instruction.imm > 31) {
        throw new Error(`${instruction.opcode}: shift amount must be 0-31`);
      }
      decoded.shamt = instruction.imm;
    }

    this.validateRegister(decoded.rd, 'rd');
    this.validateRegister(decoded.rs1, 'rs1');

    return decoded;
  }

  /**
   * Decode Load Format instruction
   * Format: opcode rd, imm(rs1)
   */
  decodeLoadFormat(instruction, decoded) {
    if (instruction.rd === undefined || instruction.rs1 === undefined || instruction.imm === undefined) {
      throw new Error(`${instruction.opcode}: missing operands`);
    }

    decoded.rd = instruction.rd;
    decoded.rs1 = instruction.rs1;
    decoded.imm = this.signExtend(instruction.imm, 12);

    this.validateRegister(decoded.rd, 'rd');
    this.validateRegister(decoded.rs1, 'rs1');

    return decoded;
  }

  /**
   * Decode Store Format instruction
   * Format: opcode rs2, imm(rs1)
   */
  decodeStoreFormat(instruction, decoded) {
    if (instruction.rs1 === undefined || instruction.rs2 === undefined || instruction.imm === undefined) {
      throw new Error(`${instruction.opcode}: missing operands`);
    }

    decoded.rs1 = instruction.rs1;
    decoded.rs2 = instruction.rs2;
    decoded.imm = this.signExtend(instruction.imm, 12);

    this.validateRegister(decoded.rs1, 'rs1');
    this.validateRegister(decoded.rs2, 'rs2');

    return decoded;
  }

  /**
   * Decode Branch Format instruction
   * Format: opcode rs1, rs2, offset
   */
  decodeBranchFormat(instruction, decoded) {
    if (instruction.rs1 === undefined || instruction.rs2 === undefined || instruction.imm === undefined) {
      throw new Error(`${instruction.opcode}: missing operands`);
    }

    decoded.rs1 = instruction.rs1;
    decoded.rs2 = instruction.rs2;
    decoded.imm = this.signExtend(instruction.imm, 13);
    
    if (instruction.label) {
      decoded.label = instruction.label;
    }

    // Branch offset must be even (aligned to 2-byte boundary)
    if (decoded.imm % 2 !== 0) {
      throw new Error(`${instruction.opcode}: branch offset must be even`);
    }

    this.validateRegister(decoded.rs1, 'rs1');
    this.validateRegister(decoded.rs2, 'rs2');

    return decoded;
  }

  /**
   * Decode JAL Format instruction
   * Format: JAL rd, offset
   */
  decodeJALFormat(instruction, decoded) {
    if (instruction.rd === undefined || instruction.imm === undefined) {
      throw new Error(`${instruction.opcode}: missing operands`);
    }

    decoded.rd = instruction.rd;
    decoded.imm = this.signExtend(instruction.imm, 21);
    
    if (instruction.label) {
      decoded.label = instruction.label;
    }

    // Jump offset must be even (aligned to 2-byte boundary)
    if (decoded.imm % 2 !== 0) {
      throw new Error(`${instruction.opcode}: jump offset must be even`);
    }

    this.validateRegister(decoded.rd, 'rd');

    return decoded;
  }

  /**
   * Decode JALR Format instruction
   * Format: JALR rd, rs1, offset
   */
  decodeJALRFormat(instruction, decoded) {
    if (instruction.rd === undefined || instruction.rs1 === undefined || instruction.imm === undefined) {
      throw new Error(`${instruction.opcode}: missing operands`);
    }

    decoded.rd = instruction.rd;
    decoded.rs1 = instruction.rs1;
    decoded.imm = this.signExtend(instruction.imm, 12);

    this.validateRegister(decoded.rd, 'rd');
    this.validateRegister(decoded.rs1, 'rs1');

    return decoded;
  }

  /**
   * Decode U-Format instruction
   * Format: opcode rd, imm
   */
  decodeUFormat(instruction, decoded) {
    if (instruction.rd === undefined || instruction.imm === undefined) {
      throw new Error(`${instruction.opcode}: missing operands`);
    }

    decoded.rd = instruction.rd;
    // U-format immediate is 20 bits, placed in upper 20 bits of 32-bit word
    decoded.imm = (instruction.imm & 0xFFFFF) << 12;

    this.validateRegister(decoded.rd, 'rd');

    return decoded;
  }

  /**
   * Validate register number
   * @param {number} reg - Register number
   * @param {string} name - Register name for error messages
   */
  validateRegister(reg, name) {
    if (reg < 0 || reg > 31) {
      throw new Error(`Invalid register ${name}: x${reg} (must be x0-x31)`);
    }
  }

  /**
   * Sign extend a value to 32 bits
   * @param {number} value - Value to sign extend
   * @param {number} bits - Number of bits in original value
   * @returns {number} Sign-extended 32-bit value
   */
  signExtend(value, bits) {
    // Create a mask for the sign bit
    const signBit = 1 << (bits - 1);
    
    // Check if sign bit is set
    if (value & signBit) {
      // Extend with 1s
      const mask = (-1 << bits);
      return value | mask;
    } else {
      // Extend with 0s (just mask to ensure correct size)
      const mask = (1 << bits) - 1;
      return value & mask;
    }
  }

  /**
   * Get human-readable description of decoded instruction
   * @param {Object} decoded - Decoded instruction
   * @returns {string} Description
   */
  getDescription(decoded) {
    const regName = (r) => `x${r}`;
    
    switch (decoded.type) {
      case 'R':
        return `${decoded.opcode} ${regName(decoded.rd)}, ${regName(decoded.rs1)}, ${regName(decoded.rs2)}`;
      
      case 'I':
      case 'IL':
        if (decoded.shamt !== undefined) {
          return `${decoded.opcode} ${regName(decoded.rd)}, ${regName(decoded.rs1)}, ${decoded.shamt}`;
        }
        return `${decoded.opcode} ${regName(decoded.rd)}, ${regName(decoded.rs1)}, ${decoded.imm}`;
      
      case 'S':
        return `${decoded.opcode} ${regName(decoded.rs2)}, ${decoded.imm}(${regName(decoded.rs1)})`;
      
      case 'SB':
        if (decoded.label) {
          return `${decoded.opcode} ${regName(decoded.rs1)}, ${regName(decoded.rs2)}, ${decoded.label}`;
        }
        return `${decoded.opcode} ${regName(decoded.rs1)}, ${regName(decoded.rs2)}, ${decoded.imm}`;
      
      case 'UJ':
        if (decoded.label) {
          return `${decoded.opcode} ${regName(decoded.rd)}, ${decoded.label}`;
        }
        return `${decoded.opcode} ${regName(decoded.rd)}, ${decoded.imm}`;
      
      case 'JALR':
        return `${decoded.opcode} ${regName(decoded.rd)}, ${regName(decoded.rs1)}, ${decoded.imm}`;
      
      case 'U':
        return `${decoded.opcode} ${regName(decoded.rd)}, ${decoded.imm >> 12}`;
      
      case 'HLT':
        return 'HLT';
      
      default:
        return decoded.opcode;
    }
  }
}

module.exports = {
  decode: (instruction) => {
    const decoder = new Decoder();
    return decoder.decode(instruction);
  },
  Decoder
};