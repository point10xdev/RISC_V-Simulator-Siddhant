import React, { useState } from 'react';
import './App.css';
import Editor from './components/Editor';
import RegisterDisplay from './components/RegisterDisplay';
import MemoryDisplay from './components/MemoryDisplay';
import axios from 'axios';

function App() {
  const [code, setCode] = useState(`# RISC-V Assembly Example
# Add two numbers and store in memory
ADDI x1, x0, 10    # x1 = 10
ADDI x2, x0, 20    # x2 = 20
ADD x3, x1, x2     # x3 = x1 + x2 = 30
SW x3, x0, 100     # Store x3 at memory[100]
HLT                # Halt execution`);

  const [registers, setRegisters] = useState(new Array(32).fill(0));
  const [memory, setMemory] = useState([]);
  const [pc, setPc] = useState(0);
  const [halted, setHalted] = useState(false);
  const [error, setError] = useState('');
  const [isRunning, setIsRunning] = useState(false);

  const API_BASE_URL = 'http://localhost:5000/api/simulator';

  // Execute all instructions at once
  const handleRun = async () => {
    setError('');
    setIsRunning(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/execute`, { code });
      
      if (response.data.success) {
        setRegisters(response.data.state.registers);
        setMemory(response.data.state.memory);
        setPc(response.data.state.pc);
        setHalted(response.data.state.halted);
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
    try {
      const currentState = {
        registers,
        memory: memory.reduce((acc, item) => {
          acc[item.address] = item.value;
          return acc;
        }, new Array(1024).fill(0)),
        pc,
        instructions: [],
        halted
      };

      const response = await axios.post(`${API_BASE_URL}/step`, {
        code,
        currentState
      });
      
      if (response.data.success) {
        setRegisters(response.data.state.registers);
        setMemory(response.data.state.memory);
        setPc(response.data.state.pc);
        setHalted(response.data.state.halted);
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
        setRegisters(response.data.state.registers);
        setMemory(response.data.state.memory);
        setPc(response.data.state.pc);
        setHalted(response.data.state.halted);
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to reset simulator');
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
            {isRunning ? 'Running...' : 'Run'}
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
          <Editor code={code} setCode={setCode} />
        </div>

        <div className="right-panel">
          <div className="info-section">
            <div className="pc-display">
              <h3>Program Counter</h3>
              <div className="pc-value">PC = {pc}</div>
            </div>
          </div>

          <RegisterDisplay registers={registers} />
          <MemoryDisplay memory={memory} />
        </div>
      </div>
    </div>
  );
}

export default App;