/**
 * parser.js
 * Parses RISC-V assembly code into structured instruction objects
 */

const { instructionFormats } = require('./isa');
const { parseRegister, parseImmediate } = require('./helpers');

class Parser {
  constructor() {
    this.instructionFormats = instructionFormats;
    this.labels = {};
  }

  /**
   * Parse assembly code into instruction objects
   * @param {string} code - Assembly code
   * @returns {Array} Array of parsed instruction objects
   */
  parse(code) {
    const lines = code.split('\n');
    const instructions = [];
    this.labels = {};
    
    // First pass: extract labels
    let instructionIndex = 0;
    for (let lineNum = 0; lineNum < lines.length; lineNum++) {
      const line = this.cleanLine(lines[lineNum]);
      if (!line) continue;
      
      // Check for label
      if (line.includes(':')) {
        const labelMatch = line.match(/^(\w+):\s*(.*)/);
        if (labelMatch) {
          const labelName = labelMatch[1];
          this.labels[labelName] = instructionIndex;
          const restOfLine = labelMatch[2].trim();
          if (restOfLine) {
            // Instruction on same line as label
            lines[lineNum] = restOfLine;
          } else {
            continue; // Label only, no instruction
          }
        }
      }
      instructionIndex++;
    }
    
    // Second pass: parse instructions
    instructionIndex = 0;
    for (let lineNum = 0; lineNum < lines.length; lineNum++) {
      const line = this.cleanLine(lines[lineNum]);
      if (!line) continue;
      
      // Skip label-only lines
      if (line.match(/^\w+:\s*$/)) continue;
      
      // Remove label if present
      let instructionLine = line;
      if (line.includes(':')) {
        const parts = line.split(':');
        instructionLine = parts[1].trim();
        if (!instructionLine) continue;
      }
      
      try {
        const instruction = this.parseInstruction(instructionLine, instructionIndex, lineNum + 1);
        instructions.push(instruction);
        instructionIndex++;
      } catch (error) {
        throw new Error(`Line ${lineNum + 1}: ${error.message}`);
      }
    }
    
    return instructions;
  }

  /**
   * Clean and normalize a line of code
   * @param {string} line - Raw line
   * @returns {string} Cleaned line
   */
  cleanLine(line) {
    // Remove comments
    const commentIndex = line.indexOf('#');
    if (commentIndex !== -1) {
      line = line.substring(0, commentIndex);
    }
    
    // Trim whitespace
    line = line.trim();
    
    return line;
  }

  /**
   * Parse a single instruction
   * @param {string} line - Instruction line
   * @param {number} index - Instruction index
   * @param {number} lineNum - Line number in source
   * @returns {Object} Parsed instruction object
   */
  parseInstruction(line, index, lineNum) {
    // Split instruction into parts
    const parts = line.split(/[\s,()]+/).filter(part => part.length > 0);
    
    if (parts.length === 0) {
      throw new Error('Empty instruction');
    }
    
    const opcode = parts[0].toUpperCase();
    
    if (!this.instructionFormats[opcode]) {
      throw new Error(`Unknown instruction: ${opcode}`);
    }
    
    const format = this.instructionFormats[opcode];
    
    const instruction = {
      opcode,
      format,
      index,
      lineNum,
      original: line
    };
    
    // Parse based on format
    switch (format) {
      case 'R':
        return this.parseRFormat(instruction, parts);
      case 'I':
        return this.parseIFormat(instruction, parts);
      case 'IL':
        return this.parseLoadFormat(instruction, parts);
      case 'S':
        return this.parseStoreFormat(instruction, parts);
      case 'SB':
        return this.parseBranchFormat(instruction, parts);
      case 'UJ':
        return this.parseJALFormat(instruction, parts);
      case 'JALR':
        return this.parseJALRFormat(instruction, parts);
      case 'U':
        return this.parseUFormat(instruction, parts);
      case 'HLT':
        return instruction;
      default:
        throw new Error(`Unknown format: ${format}`);
    }
  }

  /**
   * Parse R-Format instruction: ADD rd, rs1, rs2
   */
  parseRFormat(instruction, parts) {
    if (parts.length !== 4) {
      throw new Error(`${instruction.opcode} requires 3 operands (rd, rs1, rs2)`);
    }
    
    instruction.rd = parseRegister(parts[1]);
    instruction.rs1 = parseRegister(parts[2]);
    instruction.rs2 = parseRegister(parts[3]);
    
    return instruction;
  }

  /**
   * Parse I-Format instruction: ADDI rd, rs1, imm
   */
  parseIFormat(instruction, parts) {
    if (parts.length !== 4) {
      throw new Error(`${instruction.opcode} requires 3 operands (rd, rs1, imm)`);
    }
    
    instruction.rd = parseRegister(parts[1]);
    instruction.rs1 = parseRegister(parts[2]);
    instruction.imm = parseImmediate(parts[3], 12);
    
    return instruction;
  }

  /**
   * Parse Load Format instruction: LW rd, imm(rs1) or LW rd, rs1, imm
   */
  parseLoadFormat(instruction, parts) {
    if (parts.length === 3) {
      // Format: LW rd, imm(rs1) - parts will be: [LW, rd, imm, rs1] after split
      throw new Error(`${instruction.opcode} requires format: rd, imm(rs1) or rd, rs1, imm`);
    } else if (parts.length === 4) {
      // Format: LW rd, rs1, imm
      instruction.rd = parseRegister(parts[1]);
      instruction.rs1 = parseRegister(parts[2]);
      instruction.imm = parseImmediate(parts[3], 12);
    } else if (parts.length === 5) {
      // This happens when input is like: LW x1, 4(x2)
      // After split by [\s,()]+ we get: [LW, x1, 4, x2, '']
      instruction.rd = parseRegister(parts[1]);
      instruction.imm = parseImmediate(parts[2], 12);
      instruction.rs1 = parseRegister(parts[3]);
    } else {
      throw new Error(`${instruction.opcode} invalid format`);
    }
    
    return instruction;
  }

  /**
   * Parse Store Format instruction: SW rs2, imm(rs1) or SW rs2, rs1, imm
   */
  parseStoreFormat(instruction, parts) {
    if (parts.length === 4) {
      // Format: SW rs2, rs1, imm
      instruction.rs2 = parseRegister(parts[1]);
      instruction.rs1 = parseRegister(parts[2]);
      instruction.imm = parseImmediate(parts[3], 12);
    } else if (parts.length === 5) {
      // Format: SW rs2, imm(rs1) - after split: [SW, rs2, imm, rs1, '']
      instruction.rs2 = parseRegister(parts[1]);
      instruction.imm = parseImmediate(parts[2], 12);
      instruction.rs1 = parseRegister(parts[3]);
    } else {
      throw new Error(`${instruction.opcode} invalid format`);
    }
    
    return instruction;
  }

  /**
   * Parse Branch Format instruction: BEQ rs1, rs2, label/imm
   */
  parseBranchFormat(instruction, parts) {
    if (parts.length !== 4) {
      throw new Error(`${instruction.opcode} requires 3 operands (rs1, rs2, label/offset)`);
    }
    
    instruction.rs1 = parseRegister(parts[1]);
    instruction.rs2 = parseRegister(parts[2]);
    
    // Check if it's a label or immediate
    if (this.labels.hasOwnProperty(parts[3])) {
      instruction.label = parts[3];
      // Offset is relative to *instruction index*, will be converted to bytes in decoder
      instruction.imm = (this.labels[parts[3]] - instruction.index) * 4;
    } else {
      instruction.imm = parseImmediate(parts[3], 13);
    }
    
    return instruction;
  }

  /**
   * Parse JAL Format instruction: JAL rd, label/imm
   */
  parseJALFormat(instruction, parts) {
    if (parts.length === 2) {
      // JAL label (implicit rd = x1)
      instruction.rd = 1;
      if (this.labels.hasOwnProperty(parts[1])) {
        instruction.label = parts[1];
        instruction.imm = (this.labels[parts[1]] - instruction.index) * 4;
      } else {
        instruction.imm = parseImmediate(parts[1], 21);
      }
    } else if (parts.length === 3) {
      // JAL rd, label
      instruction.rd = parseRegister(parts[1]);
      if (this.labels.hasOwnProperty(parts[2])) {
        instruction.label = parts[2];
        instruction.imm = (this.labels[parts[2]] - instruction.index) * 4;
      } else {
        instruction.imm = parseImmediate(parts[2], 21);
      }
    } else {
      throw new Error(`${instruction.opcode} requires 1 or 2 operands`);
    }
    
    return instruction;
  }

  /**
   * Parse JALR Format instruction: JALR rd, rs1, imm
   */
  parseJALRFormat(instruction, parts) {
    if (parts.length === 2) {
      // JALR rs1 (implicit rd = x1, imm = 0)
      instruction.rd = 1;
      instruction.rs1 = parseRegister(parts[1]);
      instruction.imm = 0;
    } else if (parts.length === 3) {
      // JALR rd, rs1 (implicit imm = 0)
      instruction.rd = parseRegister(parts[1]);
      instruction.rs1 = parseRegister(parts[2]);
      instruction.imm = 0;
    } else if (parts.length === 4) {
      // JALR rd, rs1, imm
      instruction.rd = parseRegister(parts[1]);
      instruction.rs1 = parseRegister(parts[2]);
      instruction.imm = parseImmediate(parts[3], 12);
    } else {
      throw new Error(`${instruction.opcode} invalid format`);
    }
    
    return instruction;
  }

  /**
   * Parse U-Format instruction: LUI rd, imm
   */
  parseUFormat(instruction, parts) {
    if (parts.length !== 3) {
      throw new Error(`${instruction.opcode} requires 2 operands (rd, imm)`);
    }
    
    instruction.rd = parseRegister(parts[1]);
    instruction.imm = parseImmediate(parts[2], 20);
    
    return instruction;
  }

  /**
   * Clean and normalize a line of code
   * @param {string} line - Raw line
   * @returns {string} Cleaned line
   */
  cleanLine(line) {
    // Remove comments
    const commentIndex = line.indexOf('#');
    if (commentIndex !== -1) {
      line = line.substring(0, commentIndex);
    }
    
    // Trim whitespace
    line = line.trim();
    
    return line;
  }
}

module.exports = {
  parse: (code) => {
    const parser = new Parser();
    return parser.parse(code);
  },
  Parser
};