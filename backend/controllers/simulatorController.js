/**
 * backend/controllers/simulatorController.js
 * Controls the execution flow and manages simulator state.
 */
const parser = require('../utils/parser');
const decoder = require('../utils/decoder');
const executor = require('../utils/executor');
const { GoogleGenAI } = require('@google/genai'); // <--- UNCOMMENT AFTER INSTALLING @google/genai
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }); // <--- Uses key from .env

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

// --- Controller Methods (Standard Simulation) ---

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
      simulatorState.registers = currentState.registers;
      simulatorState.memory = currentState.memory; 
      simulatorState.pc = currentState.pc;
      // simulatorState.instructions = currentState.instructions; // Instructions array is intentionally omitted by frontend
      simulatorState.halted = currentState.halted;
    }
    
    // Reparse only if instructions were not loaded from the internal cache or initial state
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

// --- NEW: AI Assembly Generation Endpoint ---
exports.generateAssembly = async (req, res) => {
  const { prompt, currentCode } = req.body;

  if (!prompt) {
    return res.status(400).json({ success: false, error: 'Prompt is required.' });
  }

  const systemInstruction = `You are an expert RISC-V 32-bit assembly language generator. Your task is to convert a user's plain English instruction into the most accurate, concise, and standard RISC-V assembly code (RV32I).

GUIDELINES:
1. Output ONLY the RISC-V assembly code and comments. Do not include any explanation, headers, or markdown formatting.
2. Use standard register ABI names (a0-a7, t0-t6, s0-s11, ra, sp, gp, tp) or their numerical aliases (x0-x31).
3. Always start your output with a comment including the user's prompt, e.g., "# User Prompt: [Prompt]".
4. If the instruction is a simple operation, output only the relevant instruction(s).
5. The user is using an interactive simulator. Do not include a final 'HLT' unless the user explicitly requests to stop the program.
6. Only return the newly generated instructions, not the entire program.

Example 1:
User: add 5 and 10 and store the result in t3
Output: # User Prompt: add 5 and 10 and store the result in t3
ADDI t0, x0, 5
ADDI t1, x0, 10
ADD t3, t0, t1

Example 2:
User: Load 100 into register x5
Output: # User Prompt: Load 100 into register x5
ADDI x5, x0, 100
`;

  try {
    // If API Key is missing, run mock code and warn the user.
    if (!process.env.GEMINI_API_KEY) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate latency
      
      let mockAssembly = '';
      if (prompt.toLowerCase().includes('add') && prompt.toLowerCase().includes('register')) {
        mockAssembly = `# User Prompt: ${prompt}\n# WARNING: Using Mock Response (No API Key)\nADDI t0, x0, 10\nADDI t1, x0, 20\nADD t2, t0, t1 # Mock: Added 10 and 20\n`;
      } else if (prompt.toLowerCase().includes('jump')) {
        mockAssembly = `# User Prompt: ${prompt}\n# WARNING: Using Mock Response (No API Key)\nJAL ra, new_label\n`;
      } else {
        mockAssembly = `# User Prompt: ${prompt}\n# WARNING: Using Mock Response (No API Key)\nADDI t0, x0, 42 # Mock Default\n`;
      }

      return res.json({ success: true, assembly: mockAssembly });
    }
    
    // --- Actual Gemini API Call ---
    const model = 'gemini-2.5-flash';
    const response = await ai.models.generateContent({
      model,
      contents: [{ role: 'user', parts: [{ text: `Current code context (for labels/variables):\n${currentCode}\n\nUser Instruction: ${prompt}` }] }],
      config: {
        systemInstruction: systemInstruction,
        // Optional: Increase temperature for more creative responses, keep low for accuracy
        temperature: 0.1 
      },
    });

    const assemblyCode = response.text.trim();
    
    if (!assemblyCode) {
        throw new Error('AI failed to generate assembly. Please try a different prompt.');
    }

    res.json({ success: true, assembly: assemblyCode });

  } catch (error) {
    console.error('AI Generation Error:', error);
    res.status(500).json({
      success: false,
      error: `AI generation failed: ${error.message || 'An unknown error occurred on the server.'}. Ensure your GEMINI_API_KEY is set correctly in .env`
    });
  }
};