/**
 * backend/controllers/simulatorController.js
 * Controls the execution flow and manages simulator state.
 */
const parser = require('../utils/parser');
const decoder = require('../utils/decoder');
const executor = require('../utils/executor');

// Internal state model (simple JS object array for compatibility with the original design)
let simulatorState = {
  registers: new Array(32).fill(0),
  memory: new Array(1024).fill(0),
  pc: 0,
  instructions: [],
  halted: false
};

// --- Local Helper Function to mock the Simulator interface for the executor ---

function getSimInterface(state) {
  // Functions to allow the executor to interact with the simple state object
  return {
    getRegister: (r) => r === 0 ? 0 : state.registers[r],
    setRegister: (r, v) => { if (r !== 0) state.registers[r] = v | 0; },
    
    // Memory access helpers (handling the byte array directly)
    readByte: (addr) => {
      const val = state.memory[addr] || 0;
      return val > 127 ? val - 256 : val; // Sign extend byte
    },
    readByteUnsigned: (addr) => state.memory[addr] || 0,
    readHalfWord: (addr) => {
      const low = state.memory[addr] || 0;
      const high = state.memory[addr + 1] || 0;
      const value = low | (high << 8);
      return value > 32767 ? value - 65536 : value; // Sign extend halfword
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
}

// --- Controller Methods ---

exports.executeProgram = (req, res) => {
  try {
    const { code } = req.body;
    
    // Reset state
    simulatorState = {
      registers: new Array(32).fill(0),
      memory: new Array(1024).fill(0),
      pc: 0,
      instructions: [],
      halted: false
    };
    
    // Parse instructions
    const instructions = parser.parse(code);
    simulatorState.instructions = instructions;
    
    // Get the simulator interface
    const sim = getSimInterface(simulatorState);

    // Execute all instructions
    while (!simulatorState.halted && simulatorState.pc < instructions.length) {
      const instruction = instructions[simulatorState.pc];
      const decoded = decoder.decode(instruction);
      executor.execute(decoded, sim);
    }
    
    // Format memory for client response
    const memoryForClient = simulatorState.memory.slice(0, 256).map((value, index) => ({ address: index, value }));

    res.json({
      success: true,
      state: {
        registers: simulatorState.registers,
        memory: memoryForClient,
        pc: simulatorState.pc,
        halted: simulatorState.halted
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

exports.stepExecution = (req, res) => {
  try {
    const { code, currentState } = req.body;
    
    if (currentState) {
      // Load current state from request
      // Note: The frontend sends a flat array for registers and a sparse array for memory
      // We assume memory array is reconstructed to the full 1024 size here for simplicity.
      simulatorState.registers = currentState.registers;
      simulatorState.memory = currentState.memory; 
      simulatorState.pc = currentState.pc;
      // simulatorState.instructions = currentState.instructions; // Instructions array is omitted by frontend on step request.
      simulatorState.halted = currentState.halted;
    }
    
    // Reparse only if instructions were not loaded from the internal cache or initial state
    // This maintains the instruction list if it was already parsed in a previous call.
    if (!simulatorState.instructions.length) {
      simulatorState.instructions = parser.parse(code);
    }
    
    // Get the simulator interface
    const sim = getSimInterface(simulatorState);

    if (!simulatorState.halted && simulatorState.pc < simulatorState.instructions.length) {
      const instruction = simulatorState.instructions[simulatorState.pc];
      const decoded = decoder.decode(instruction);
      executor.execute(decoded, sim);
    }
    
    // Format memory for client response
    const memoryForClient = simulatorState.memory.slice(0, 256).map((value, index) => ({ address: index, value }));
    
    res.json({
      success: true,
      state: {
        registers: simulatorState.registers,
        memory: memoryForClient,
        pc: simulatorState.pc,
        halted: simulatorState.halted
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

exports.reset = (req, res) => {
  simulatorState = {
    registers: new Array(32).fill(0),
    memory: new Array(1024).fill(0),
    pc: 0,
    instructions: [],
    halted: false
  };
  
  // Format memory for client response
  const memoryForClient = simulatorState.memory.slice(0, 256).map((value, index) => ({ address: index, value }));

  res.json({
    success: true,
    state: {
      registers: simulatorState.registers,
      memory: memoryForClient,
      pc: simulatorState.pc,
      halted: simulatorState.halted
    }
  });
};