import React from 'react';
import './RegisterDisplay.css';

function RegisterDisplay({ registers }) {
  const registerNames = [
    'zero', 'ra', 'sp', 'gp', 'tp', 't0', 't1', 't2',
    's0/fp', 's1', 'a0', 'a1', 'a2', 'a3', 'a4', 'a5',
    'a6', 'a7', 's2', 's3', 's4', 's5', 's6', 's7',
    's8', 's9', 's10', 's11', 't3', 't4', 't5', 't6'
  ];

  const formatValue = (value) => {
    // Display as signed decimal and hexadecimal
    const signed = value | 0;
    const hex = (value >>> 0).toString(16).toUpperCase().padStart(8, '0');
    return { signed, hex };
  };

  return (
    <div className="register-display">
      <div className="register-header">
        <h2>Registers</h2>
      </div>
      <div className="register-grid">
        {registers.map((value, index) => {
          const { signed, hex } = formatValue(value);
          const isNonZero = value !== 0;
          
          return (
            <div 
              key={index} 
              className={`register-item ${isNonZero ? 'non-zero' : ''}`}
            >
              <div className="register-name">
                <span className="reg-number">x{index}</span>
                <span className="reg-alias">({registerNames[index]})</span>
              </div>
              <div className="register-value">
                <span className="value-dec">{signed}</span>
                <span className="value-hex">0x{hex}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default RegisterDisplay;