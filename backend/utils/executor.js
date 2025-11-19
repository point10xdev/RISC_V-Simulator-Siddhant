/**
 * executor.js
 * Executes decoded RISC-V instructions
 * Handles all instruction types and updates simulator state
 */

const Simulator = require('../models/Simulator');

class Executor {
  /**
   * Execute a decoded instruction
   * @param {Object} decoded - Decoded instruction
   * @param {Object} state - Simulator state (for stateless execution)
   */
  execute(decoded, state) {
    // Create a temporary simulator instance if using state object
    let sim;
    if (state.registers && Array.isArray(state.registers)) {
      sim = {
        getRegister: (r) => r === 0 ? 0 : state.registers[r],
        setRegister: (r, v) => { if (r !== 0) state.registers[r] = v | 0; },
        readByte: (addr) => {
          const val = state.memory[addr] || 0;
          // Sign extend byte
          return val > 127 ? val - 256 : val;
        },
        readByteUnsigned: (addr) => state.memory[addr] || 0,
        readHalfWord: (addr) => {
          const low = state.memory[addr] || 0;
          const high = state.memory[addr + 1] || 0;
          const value = low | (high << 8);
          // Sign extend halfword
          return value > 32767 ? value - 65536 : value;
        },
        readHalfWordUnsigned: (addr) => {
          const low = state.memory[addr] || 0;
          const high = state.memory[addr + 1] || 0;
          return low | (high << 8);
        },
        readWord: (addr) => {
          const b0 = state.memory[addr] || 0;
          const b1 = state.memory[addr + 1] || 0;
          const b2 = state.memory[addr + 2] || 0;
          const b3 = state.memory[addr + 3] || 0;
          return b0 | (b1 << 8) | (b2 << 16) | (b3 << 24);
        },
        writeByte: (addr, val) => { state.memory[addr] = val & 0xFF; },
        writeHalfWord: (addr, val) => {
          state.memory[addr] = val & 0xFF;
          state.memory[addr + 1] = (val >> 8) & 0xFF;
        },
        writeWord: (addr, val) => {
          state.memory[addr] = val & 0xFF;
          state.memory[addr + 1] = (val >> 8) & 0xFF;
          state.memory[addr + 2] = (val >> 16) & 0xFF;
          state.memory[addr + 3] = (val >> 24) & 0xFF;
        },
        pc: state.pc,
        setPC: (v) => { state.pc = v; },
        incrementPC: () => { state.pc++; },
        halt: () => { state.halted = true; }
      };
    } else {
      sim = state; // Assume it's a Simulator instance
    }

    // Execute based on instruction type
    switch (decoded.opcode) {
      // R-Format Instructions
      case 'ADD':
        return this.executeADD(decoded, sim);
      case 'SUB':
        return this.executeSUB(decoded, sim);
      case 'SLL':
        return this.executeSLL(decoded, sim);
      case 'SLT':
        return this.executeSLT(decoded, sim);
      case 'SLTU':
        return this.executeSLTU(decoded, sim);
      case 'XOR':
        return this.executeXOR(decoded, sim);
      case 'SRL':
        return this.executeSRL(decoded, sim);
      case 'SRA':
        return this.executeSRA(decoded, sim);
      case 'OR':
        return this.executeOR(decoded, sim);
      case 'AND':
        return this.executeAND(decoded, sim);

      // I-Format Instructions (Arithmetic/Logical)
      case 'ADDI':
        return this.executeADDI(decoded, sim);
      case 'SLTI':
        return this.executeSLTI(decoded, sim);
      case 'SLTIU':
        return this.executeSLTIU(decoded, sim);
      case 'XORI':
        return this.executeXORI(decoded, sim);
      case 'ORI':
        return this.executeORI(decoded, sim);
      case 'ANDI':
        return this.executeANDI(decoded, sim);
      case 'SLLI':
        return this.executeSLLI(decoded, sim);
      case 'SRLI':
        return this.executeSRLI(decoded, sim);
      case 'SRAI':
        return this.executeSRAI(decoded, sim);

      // Load Instructions
      case 'LB':
        return this.executeLB(decoded, sim);
      case 'LH':
        return this.executeLH(decoded, sim);
      case 'LW':
        return this.executeLW(decoded, sim);
      case 'LBU':
        return this.executeLBU(decoded, sim);
      case 'LHU':
        return this.executeLHU(decoded, sim);

      // Store Instructions
      case 'SB':
        return this.executeSB(decoded, sim);
      case 'SH':
        return this.executeSH(decoded, sim);
      case 'SW':
        return this.executeSW(decoded, sim);

      // Branch Instructions
      case 'BEQ':
        return this.executeBEQ(decoded, sim);
      case 'BNE':
        return this.executeBNE(decoded, sim);
      case 'BLT':
        return this.executeBLT(decoded, sim);
      case 'BGE':
        return this.executeBGE(decoded, sim);
      case 'BLTU':
        return this.executeBLTU(decoded, sim);
      case 'BGEU':
        return this.executeBGEU(decoded, sim);

      // Jump Instructions
      case 'JAL':
        return this.executeJAL(decoded, sim);
      case 'JALR':
        return this.executeJALR(decoded, sim);

      // Upper Immediate Instructions
      case 'LUI':
        return this.executeLUI(decoded, sim);
      case 'AUIPC':
        return this.executeAUIPC(decoded, sim);

      // Special Instructions
      case 'HLT':
        return this.executeHLT(decoded, sim);

      default:
        throw new Error(`Execution not implemented for: ${decoded.opcode}`);
    }
  }

  // ========== R-Format Instructions ==========

  executeADD(decoded, sim) {
    const rs1Val = sim.getRegister(decoded.rs1);
    const rs2Val = sim.getRegister(decoded.rs2);
    const result = (rs1Val + rs2Val) | 0; // Force 32-bit signed
    sim.setRegister(decoded.rd, result);
    sim.incrementPC();
  }

  executeSUB(decoded, sim) {
    const rs1Val = sim.getRegister(decoded.rs1);
    const rs2Val = sim.getRegister(decoded.rs2);
    const result = (rs1Val - rs2Val) | 0;
    sim.setRegister(decoded.rd, result);
    sim.incrementPC();
  }

  executeSLL(decoded, sim) {
    const rs1Val = sim.getRegister(decoded.rs1);
    const rs2Val = sim.getRegister(decoded.rs2);
    const shamt = rs2Val & 0x1F; // Only lower 5 bits
    const result = (rs1Val << shamt) | 0;
    sim.setRegister(decoded.rd, result);
    sim.incrementPC();
  }

  executeSLT(decoded, sim) {
    const rs1Val = sim.getRegister(decoded.rs1);
    const rs2Val = sim.getRegister(decoded.rs2);
    const result = rs1Val < rs2Val ? 1 : 0;
    sim.setRegister(decoded.rd, result);
    sim.incrementPC();
  }

  executeSLTU(decoded, sim) {
    const rs1Val = sim.getRegister(decoded.rs1) >>> 0; // Unsigned
    const rs2Val = sim.getRegister(decoded.rs2) >>> 0; // Unsigned
    const result = rs1Val < rs2Val ? 1 : 0;
    sim.setRegister(decoded.rd, result);
    sim.incrementPC();
  }

  executeXOR(decoded, sim) {
    const rs1Val = sim.getRegister(decoded.rs1);
    const rs2Val = sim.getRegister(decoded.rs2);
    const result = (rs1Val ^ rs2Val) | 0;
    sim.setRegister(decoded.rd, result);
    sim.incrementPC();
  }

  executeSRL(decoded, sim) {
    const rs1Val = sim.getRegister(decoded.rs1) >>> 0; // Unsigned
    const rs2Val = sim.getRegister(decoded.rs2);
    const shamt = rs2Val & 0x1F;
    const result = (rs1Val >>> shamt) | 0;
    sim.setRegister(decoded.rd, result);
    sim.incrementPC();
  }

  executeSRA(decoded, sim) {
    const rs1Val = sim.getRegister(decoded.rs1);
    const rs2Val = sim.getRegister(decoded.rs2);
    const shamt = rs2Val & 0x1F;
    const result = (rs1Val >> shamt) | 0; // Arithmetic shift
    sim.setRegister(decoded.rd, result);
    sim.incrementPC();
  }

  executeOR(decoded, sim) {
    const rs1Val = sim.getRegister(decoded.rs1);
    const rs2Val = sim.getRegister(decoded.rs2);
    const result = (rs1Val | rs2Val) | 0;
    sim.setRegister(decoded.rd, result);
    sim.incrementPC();
  }

  executeAND(decoded, sim) {
    const rs1Val = sim.getRegister(decoded.rs1);
    const rs2Val = sim.getRegister(decoded.rs2);
    const result = (rs1Val & rs2Val) | 0;
    sim.setRegister(decoded.rd, result);
    sim.incrementPC();
  }

  // ========== I-Format Instructions (Arithmetic/Logical) ==========

  executeADDI(decoded, sim) {
    const rs1Val = sim.getRegister(decoded.rs1);
    const result = (rs1Val + decoded.imm) | 0;
    sim.setRegister(decoded.rd, result);
    sim.incrementPC();
  }

  executeSLTI(decoded, sim) {
    const rs1Val = sim.getRegister(decoded.rs1);
    const result = rs1Val < decoded.imm ? 1 : 0;
    sim.setRegister(decoded.rd, result);
    sim.incrementPC();
  }

  executeSLTIU(decoded, sim) {
    const rs1Val = sim.getRegister(decoded.rs1) >>> 0;
    const imm = decoded.imm >>> 0;
    const result = rs1Val < imm ? 1 : 0;
    sim.setRegister(decoded.rd, result);
    sim.incrementPC();
  }

  executeXORI(decoded, sim) {
    const rs1Val = sim.getRegister(decoded.rs1);
    const result = (rs1Val ^ decoded.imm) | 0;
    sim.setRegister(decoded.rd, result);
    sim.incrementPC();
  }

  executeORI(decoded, sim) {
    const rs1Val = sim.getRegister(decoded.rs1);
    const result = (rs1Val | decoded.imm) | 0;
    sim.setRegister(decoded.rd, result);
    sim.incrementPC();
  }

  executeANDI(decoded, sim) {
    const rs1Val = sim.getRegister(decoded.rs1);
    const result = (rs1Val & decoded.imm) | 0;
    sim.setRegister(decoded.rd, result);
    sim.incrementPC();
  }

  executeSLLI(decoded, sim) {
    const rs1Val = sim.getRegister(decoded.rs1);
    const shamt = decoded.shamt || (decoded.imm & 0x1F);
    const result = (rs1Val << shamt) | 0;
    sim.setRegister(decoded.rd, result);
    sim.incrementPC();
  }

  executeSRLI(decoded, sim) {
    const rs1Val = sim.getRegister(decoded.rs1) >>> 0;
    const shamt = decoded.shamt || (decoded.imm & 0x1F);
    const result = (rs1Val >>> shamt) | 0;
    sim.setRegister(decoded.rd, result);
    sim.incrementPC();
  }

  executeSRAI(decoded, sim) {
    const rs1Val = sim.getRegister(decoded.rs1);
    const shamt = decoded.shamt || (decoded.imm & 0x1F);
    const result = (rs1Val >> shamt) | 0;
    sim.setRegister(decoded.rd, result);
    sim.incrementPC();
  }

  // ========== Load Instructions ==========

  executeLB(decoded, sim) {
    const rs1Val = sim.getRegister(decoded.rs1);
    const address = (rs1Val + decoded.imm) | 0;
    const value = sim.readByte(address);
    sim.setRegister(decoded.rd, value);
    sim.incrementPC();
  }

  executeLH(decoded, sim) {
    const rs1Val = sim.getRegister(decoded.rs1);
    const address = (rs1Val + decoded.imm) | 0;
    const value = sim.readHalfWord(address);
    sim.setRegister(decoded.rd, value);
    sim.incrementPC();
  }

  executeLW(decoded, sim) {
    const rs1Val = sim.getRegister(decoded.rs1);
    const address = (rs1Val + decoded.imm) | 0;
    const value = sim.readWord(address);
    sim.setRegister(decoded.rd, value);
    sim.incrementPC();
  }

  executeLBU(decoded, sim) {
    const rs1Val = sim.getRegister(decoded.rs1);
    const address = (rs1Val + decoded.imm) | 0;
    const value = sim.readByteUnsigned(address);
    sim.setRegister(decoded.rd, value);
    sim.incrementPC();
  }

  executeLHU(decoded, sim) {
    const rs1Val = sim.getRegister(decoded.rs1);
    const address = (rs1Val + decoded.imm) | 0;
    const value = sim.readHalfWordUnsigned(address);
    sim.setRegister(decoded.rd, value);
    sim.incrementPC();
  }

  // ========== Store Instructions ==========

  executeSB(decoded, sim) {
    const rs1Val = sim.getRegister(decoded.rs1);
    const rs2Val = sim.getRegister(decoded.rs2);
    const address = (rs1Val + decoded.imm) | 0;
    sim.writeByte(address, rs2Val & 0xFF);
    sim.incrementPC();
  }

  executeSH(decoded, sim) {
    const rs1Val = sim.getRegister(decoded.rs1);
    const rs2Val = sim.getRegister(decoded.rs2);
    const address = (rs1Val + decoded.imm) | 0;
    sim.writeHalfWord(address, rs2Val & 0xFFFF);
    sim.incrementPC();
  }

  executeSW(decoded, sim) {
    const rs1Val = sim.getRegister(decoded.rs1);
    const rs2Val = sim.getRegister(decoded.rs2);
    const address = (rs1Val + decoded.imm) | 0;
    sim.writeWord(address, rs2Val);
    sim.incrementPC();
  }

  // ========== Branch Instructions ==========

  executeBEQ(decoded, sim) {
    const rs1Val = sim.getRegister(decoded.rs1);
    const rs2Val = sim.getRegister(decoded.rs2);
    if (rs1Val === rs2Val) {
      // Branch taken: PC = PC + offset/4 (offset is in bytes, we track instructions)
      const offset = Math.floor(decoded.imm / 4);
      sim.setPC((sim.pc || 0) + offset);
    } else {
      sim.incrementPC();
    }
  }

  executeBNE(decoded, sim) {
    const rs1Val = sim.getRegister(decoded.rs1);
    const rs2Val = sim.getRegister(decoded.rs2);
    if (rs1Val !== rs2Val) {
      const offset = Math.floor(decoded.imm / 4);
      sim.setPC((sim.pc || 0) + offset);
    } else {
      sim.incrementPC();
    }
  }

  executeBLT(decoded, sim) {
    const rs1Val = sim.getRegister(decoded.rs1);
    const rs2Val = sim.getRegister(decoded.rs2);
    if (rs1Val < rs2Val) {
      const offset = Math.floor(decoded.imm / 4);
      sim.setPC((sim.pc || 0) + offset);
    } else {
      sim.incrementPC();
    }
  }

  executeBGE(decoded, sim) {
    const rs1Val = sim.getRegister(decoded.rs1);
    const rs2Val = sim.getRegister(decoded.rs2);
    if (rs1Val >= rs2Val) {
      const offset = Math.floor(decoded.imm / 4);
      sim.setPC((sim.pc || 0) + offset);
    } else {
      sim.incrementPC();
    }
  }

  executeBLTU(decoded, sim) {
    const rs1Val = sim.getRegister(decoded.rs1) >>> 0;
    const rs2Val = sim.getRegister(decoded.rs2) >>> 0;
    if (rs1Val < rs2Val) {
      const offset = Math.floor(decoded.imm / 4);
      sim.setPC((sim.pc || 0) + offset);
    } else {
      sim.incrementPC();
    }
  }

  executeBGEU(decoded, sim) {
    const rs1Val = sim.getRegister(decoded.rs1) >>> 0;
    const rs2Val = sim.getRegister(decoded.rs2) >>> 0;
    if (rs1Val >= rs2Val) {
      const offset = Math.floor(decoded.imm / 4);
      sim.setPC((sim.pc || 0) + offset);
    } else {
      sim.incrementPC();
    }
  }

  // ========== Jump Instructions ==========

  executeJAL(decoded, sim) {
    // Save return address (PC + 1 in instruction count)
    const returnAddress = (sim.pc || 0) + 1;
    sim.setRegister(decoded.rd, returnAddress);
    
    // Jump: PC = PC + offset (offset is in bytes, convert to instruction count)
    const offset = Math.floor(decoded.imm / 4);
    sim.setPC((sim.pc || 0) + offset);
  }

  executeJALR(decoded, sim) {
    const rs1Val = sim.getRegister(decoded.rs1);
    
    // Save return address (PC + 1)
    const returnAddress = (sim.pc || 0) + 1;
    
    // Calculate target address
    // If rs1 is small (< 1000), treat it as instruction index
    // Otherwise, treat it as byte address and convert
    let targetPC;
    if (rs1Val < 1000) {
      // rs1 is instruction index
      targetPC = rs1Val + Math.floor(decoded.imm / 4);
    } else {
      // rs1 is byte address, convert to instruction index
      targetPC = Math.floor(((rs1Val + decoded.imm) & ~1) / 4);
    }
    
    // Set return address BEFORE jumping (in case rd == rs1)
    sim.setRegister(decoded.rd, returnAddress);
    sim.setPC(Math.floor(targetPC));
  }

  // ========== Upper Immediate Instructions ==========

  executeLUI(decoded, sim) {
    // LUI: Load upper immediate
    // rd = imm (already shifted left by 12 in decoder)
    sim.setRegister(decoded.rd, decoded.imm);
    sim.incrementPC();
  }

  executeAUIPC(decoded, sim) {
    // AUIPC: Add upper immediate to PC
    // rd = PC + imm (imm already shifted left by 12)
    // PC is in instruction count, convert to byte address
    const pcBytes = (sim.pc || 0) * 4;
    const result = (pcBytes + decoded.imm) | 0;
    sim.setRegister(decoded.rd, result);
    sim.incrementPC();
  }

  // ========== Special Instructions ==========

  executeHLT(decoded, sim) {
    sim.halt();
    // Don't increment PC on halt
  }
}

module.exports = {
  execute: (decoded, state) => {
    const executor = new Executor();
    return executor.execute(decoded, state);
  },
  Executor
};