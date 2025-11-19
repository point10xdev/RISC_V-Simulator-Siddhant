const parser = require('../utils/parser');
const decoder = require('../utils/decoder');
const executor = require('../utils/executor');

// Initialize simulator state
let simulatorState = {
  registers: new Array(32).fill(0),
  memory: new Array(1024).fill(0),
  pc: 0,
  instructions: [],
  halted: false
};

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
    
    // Execute all instructions
    while (!simulatorState.halted && simulatorState.pc < instructions.length) {
      const instruction = instructions[simulatorState.pc];
      const decoded = decoder.decode(instruction);
      executor.execute(decoded, simulatorState);
    }
    
    res.json({
      success: true,
      state: {
        registers: simulatorState.registers,
        memory: simulatorState.memory.slice(0, 256), // Send first 256 bytes
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
      simulatorState = currentState;
    }
    
    if (!simulatorState.instructions.length) {
      simulatorState.instructions = parser.parse(code);
    }
    
    if (!simulatorState.halted && simulatorState.pc < simulatorState.instructions.length) {
      const instruction = simulatorState.instructions[simulatorState.pc];
      const decoded = decoder.decode(instruction);
      executor.execute(decoded, simulatorState);
    }
    
    res.json({
      success: true,
      state: {
        registers: simulatorState.registers,
        memory: simulatorState.memory.slice(0, 256),
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
  
  res.json({
    success: true,
    state: {
      registers: simulatorState.registers,
      memory: simulatorState.memory.slice(0, 256),
      pc: simulatorState.pc,
      halted: simulatorState.halted
    }
  });
};
