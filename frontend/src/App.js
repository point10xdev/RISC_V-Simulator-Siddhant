import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import Editor from './components/Editor';
import RegisterDisplay from './components/RegisterDisplay';
import MemoryDisplay from './components/MemoryDisplay';
import ExecutionLog from './components/ExecutionLog';
import AIPromptBox from './components/AIPromptBox'; 
import axios from 'axios';

function App() {
  const defaultCode = `# RISC-V Assembly Example
# Add two numbers and store in memory
ADDI x1, x0, 10    # x1 = 10
ADDI x2, x0, 20    # x2 = 20
ADD x3, x1, x2     # x3 = x1 + x2 = 30
SW x3, x0, 100     # Store x3 at memory[100]
HLT                # Halt execution`;
  
  const [code, setCode] = useState(defaultCode);
  const [registers, setRegisters] = useState(new Array(32).fill(0));
  const [memory, setMemory] = useState([]);
  const [pc, setPc] = useState(0);
  const [halted, setHalted] = useState(false);
  const [error, setError] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [instructions, setInstructions] = useState([]);
  const [log, setLog] = useState([]);

  const API_BASE_URL = 'http://localhost:5000/api/simulator';

  // Helper to fetch instructions for display (Run once on code change/mount)
  const fetchInstructionsForDisplay = useCallback((currentCode) => {
    // FIX: Ensure currentCode is a string before attempting string methods
    const safeCode = currentCode || ''; 
    const rawLines = safeCode.split('\n');
    const displayInstructions = [];
    let instructionIndex = 0;
    for (let i = 0; i < rawLines.length; i++) {
        const line = rawLines[i].trim();
        // Simple heuristic to detect if a line contains executable code
        const hasExecutable = line && !line.startsWith('#') && !line.startsWith('.') && !line.endsWith(':');
        
        if (hasExecutable || line.includes(':')) {
            // Further cleaning to remove comments after instruction
            const cleanLine = line.split('#')[0].trim();
            displayInstructions.push({ 
              lineNum: i + 1, 
              text: cleanLine, 
              index: instructionIndex 
            });
            // Only increment instruction index for executable lines (excluding label-only lines)
            if (hasExecutable || (line.includes(':') && cleanLine.split(':')[1].trim() !== '')) {
                instructionIndex++;
            } else if (line.endsWith(':') && line.split(':')[0].trim() !== '') {
                // Label only line - logic remains the same
            }
        }
    }
    setInstructions(displayInstructions.filter(inst => inst.text !== ''));
  }, []);

  useEffect(() => {
    fetchInstructionsForDisplay(code);
  }, [code, fetchInstructionsForDisplay]);


  // Update state from a successful API response
  const updateState = (data, isReset = false) => {
    const newState = data.state;
    setRegisters(newState.registers);
    setMemory(newState.memory);
    setPc(newState.pc);
    setHalted(newState.halted);

    // Find the executed instruction based on the current PC value
    const executedInstruction = instructions.find(inst => inst.index === newState.pc - 1);
    
    // Update log
    if (isReset) {
      setLog([{ pc: 0, instruction: 'Simulator Reset', type: 'RESET' }]);
    } else if (newState.halted) {
      setLog(prev => [{ pc: newState.pc, instruction: executedInstruction?.text || 'HLT', type: 'HALT' }, ...prev.slice(0, 9)]);
    } else if (executedInstruction) {
      setLog(prev => [{ pc: executedInstruction.index, instruction: executedInstruction.text, type: 'EXECUTE' }, ...prev.slice(0, 9)]);
    }
  };


  // Execute all instructions at once
  const handleRun = async () => {
    setError('');
    setIsRunning(true);
    setLog(prev => [{ pc: pc, instruction: 'Running entire program...', type: 'RUN' }, ...prev.slice(0, 9)]);
    try {
      const response = await axios.post(`${API_BASE_URL}/execute`, { code });
      
      if (response.data.success) {
        // The PC returned from a successful RUN is the instruction index *after* HLT, or the instruction length.
        // We artificially set the PC to the halted index to show the final state, and rely on `updateState` to log the HLT.
        setPc(response.data.state.pc);
        setHalted(response.data.state.halted); 
        updateState(response.data);
      } else {
        setError(response.data.error || 'Execution failed');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to execute program');
    } finally {
      setIsRunning(false);
    }
  };

  // Step through one instruction at a time
  const handleStep = async () => {
    setError('');
    if (halted) return;

    // Prepare currentState: need to convert the simplified memory array back to the expected format
    const memoryMap = memory.reduce((acc, item) => {
      acc[item.address] = item.value;
      return acc;
    }, new Array(1024).fill(0));

    try {
      const currentState = {
        registers,
        memory: memoryMap,
        pc,
        // Instructions array is not passed back, relying on code for backend re-parse
        halted
      };

      const response = await axios.post(`${API_BASE_URL}/step`, {
        code,
        currentState
      });
      
      if (response.data.success) {
        updateState(response.data);
      } else {
        setError(response.data.error || 'Step execution failed');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to step through program');
    }
  };

  // Reset simulator to initial state
  const handleReset = async () => {
    setError('');
    try {
      const response = await axios.post(`${API_BASE_URL}/reset`);
      
      if (response.data.success) {
        updateState(response.data, true);
        fetchInstructionsForDisplay(code); // Re-parse for display to ensure indices are correct
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to reset simulator');
    }
  };
  
  // Handle assembly generation from AI prompt (calls backend API)
  const handleAIGeneration = async (prompt) => {
    setError(''); 

    try {
        const response = await axios.post(`${API_BASE_URL}/generate-assembly`, { 
            prompt, 
            currentCode: code 
        });

        if (response.data.success) {
            const newAssembly = response.data.assembly || '';
            
            // 2. Append the generated assembly to the current code
            setCode(prevCode => {
                // FIX: Explicitly check and handle non-string values for prevCode
                const safePrevCode = typeof prevCode === 'string' ? prevCode : '';
                const trimmedCode = safePrevCode.trim();
                const separator = trimmedCode === '' ? '' : '\n\n';
                return `${trimmedCode}${separator}${newAssembly}`;
            });
            // 3. Reset simulator state
            await handleReset();

        } else {
            setError(response.data.error || 'AI generation failed.');
        }
    } catch (err) {
        setError(err.response?.data?.error || err.message || 'Failed to communicate with AI service');
    }
  };


  return (
    <div className="App">
      <header className="app-header">
        <h1>RISC-V 32-bit Simulator</h1>
        <div className="control-buttons">
          <button 
            onClick={handleRun} 
            disabled={isRunning || halted}
            className="btn btn-run"
          >
            {isRunning ? 'Running...' : 'Run All'}
          </button>
          <button 
            onClick={handleStep} 
            disabled={isRunning || halted}
            className="btn btn-step"
          >
            Step
          </button>
          <button 
            onClick={handleReset} 
            disabled={isRunning}
            className="btn btn-reset"
          >
            Reset
          </button>
        </div>
      </header>

      {error && (
        <div className="error-message">
          <strong>Error:</strong> {error}
        </div>
      )}

      {halted && (
        <div className="status-message">
          <strong>Status:</strong> Program halted
        </div>
      )}

      <div className="main-container">
        <div className="left-panel">
          {/* Pass instructions and pc to Editor for highlighting */}
          <Editor 
            code={code} 
            setCode={setCode} 
            instructions={instructions}
            pc={pc}
          />
          {/* NEW: AI Prompt Box */}
          <AIPromptBox 
            onGenerate={handleAIGeneration} // Pass the handler to the child
            currentCode={code}             // Pass current code for context
            onError={setError}             // Pass the error setter
          />
        </div>

        <div className="right-panel">
          
          {/* NEW: Grid for PC/Log and Registers */}
          <div className="top-right-grid">
            <ExecutionLog log={log} pc={pc} halted={halted} />
            <RegisterDisplay registers={registers} />
          </div>
          
          <MemoryDisplay memory={memory} />
        </div>
      </div>
    </div>
  );
}

export default App;