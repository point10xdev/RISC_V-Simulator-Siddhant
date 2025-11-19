import React from 'react';
import './ExecutionLog.css';

function ExecutionLog({ log, pc, halted }) {
  // Use the log entries for display (excluding intermediary messages)
  const displayLog = log.filter(item => item.type === 'EXECUTE' || item.type === 'HALT');

  return (
    <div className="execution-log-display">
      <div className="log-header">
        <h2>Execution Status</h2>
        <div className="pc-value-indicator">PC = {pc}</div>
      </div>
      <div className="log-content">
        <div className="status-box">
          <div className="box-header">Program Counter (Instruction Index)</div>
          <div className="box-value pc-value">{pc}</div>
        </div>
        
        <div className="log-list-container">
            <div className="log-list-header">Execution Log (Recent Instructions)</div>
            {halted && (
                <div className="log-item log-halted">
                    <span className="log-type">[HLT]</span> Program Halted
                </div>
            )}
            {displayLog.length > 0 ? (
                displayLog.map((item, index) => (
                    <div key={index} className={`log-item log-${item.type.toLowerCase()}`}>
                        <span className="log-type">[{item.type.slice(0, 3)}]</span>
                        <span className="log-pc">@ {item.pc}</span>
                        <span className="log-instruction">{item.instruction}</span>
                    </div>
                ))
            ) : (
                <div className="log-empty">Ready to Run/Step</div>
            )}
        </div>
      </div>
    </div>
  );
}

export default ExecutionLog;