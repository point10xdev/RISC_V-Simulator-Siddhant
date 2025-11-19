/**
 * isa.js
 * RISC-V Instruction Set Architecture Definitions (32-bit)
 * Centralizes static data from parser.js and decoder.js
 */

exports.registerMap = {
  // ABI names to register numbers
  'zero': 0, 'x0': 0,
  'ra': 1, 'x1': 1,
  'sp': 2, 'x2': 2,
  'gp': 3, 'x3': 3,
  'tp': 4, 'x4': 4,
  't0': 5, 'x5': 5,
  't1': 6, 'x6': 6,
  't2': 7, 'x7': 7,
  's0': 8, 'fp': 8, 'x8': 8,
  's1': 9, 'x9': 9,
  'a0': 10, 'x10': 10,
  'a1': 11, 'x11': 11,
  'a2': 12, 'x12': 12,
  'a3': 13, 'x13': 13,
  'a4': 14, 'x14': 14,
  'a5': 15, 'x15': 15,
  'a6': 16, 'x16': 16,
  'a7': 17, 'x17': 17,
  's2': 18, 'x18': 18,
  's3': 19, 'x19': 19,
  's4': 20, 'x20': 20,
  's5': 21, 'x21': 21,
  's6': 22, 'x22': 22,
  's7': 23, 'x23': 23,
  's8': 24, 'x24': 24,
  's9': 25, 'x25': 25,
  's10': 26, 'x26': 26,
  's11': 27, 'x27': 27,
  't3': 28, 'x28': 28,
  't4': 29, 'x29': 29,
  't5': 30, 'x30': 30,
  't6': 31, 'x31': 31
};

exports.opcodes = {
  // Opcode definitions with funct3 and funct7
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

exports.instructionFormats = {
  // Mapping from opcode to simplified format type for the parser
  'ADD': 'R', 'SUB': 'R', 'SLL': 'R', 'SLT': 'R', 'SLTU': 'R',
  'XOR': 'R', 'SRL': 'R', 'SRA': 'R', 'OR': 'R', 'AND': 'R',
  
  'ADDI': 'I', 'SLTI': 'I', 'SLTIU': 'I', 'XORI': 'I',
  'ORI': 'I', 'ANDI': 'I', 'SLLI': 'I', 'SRLI': 'I', 'SRAI': 'I',
  
  'LB': 'IL', 'LH': 'IL', 'LW': 'IL', 'LBU': 'IL', 'LHU': 'IL',
  
  'SB': 'S', 'SH': 'S', 'SW': 'S',
  
  'BEQ': 'SB', 'BNE': 'SB', 'BLT': 'SB', 'BGE': 'SB', 'BLTU': 'SB', 'BGEU': 'SB',
  
  'JAL': 'UJ', 'JALR': 'JALR',
  
  'LUI': 'U', 'AUIPC': 'U',
  
  'HLT': 'HLT'
};