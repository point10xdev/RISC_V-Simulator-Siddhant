import React, { useState } from 'react';
import './MemoryDisplay.css';

function MemoryDisplay({ memory }) {
  const [viewMode, setViewMode] = useState('changed'); // 'all' or 'changed'

  // Convert memory array to display format
  const getMemoryDisplay = () => {
    if (!memory || memory.length === 0) {
      return [];
    }

    if (viewMode === 'changed') {
      // Show only non-zero memory locations
      return memory.filter(item => item && item.value !== 0);
    } else {
      // Show first 256 bytes
      return memory.slice(0, 256);
    }
  };

  const formatAddress = (address) => {
    if (address === undefined || address === null) return '0x0000';
    return '0x' + address.toString(16).toUpperCase().padStart(4, '0');
  };

  const formatValue = (value) => {
    if (value === undefined || value === null) value = 0;
    const hex = value.toString(16).toUpperCase().padStart(2, '0');
    return `0x${hex} (${value})`;
  };

  const displayMemory = getMemoryDisplay();

  return (
    <div className="memory-display">
      <div className="memory-header">
        <h2>Memory</h2>
        <div className="memory-controls">
          <button
            className={`view-btn ${viewMode === 'changed' ? 'active' : ''}`}
            onClick={() => setViewMode('changed')}
          >
            Changed Only
          </button>
          <button
            className={`view-btn ${viewMode === 'all' ? 'active' : ''}`}
            onClick={() => setViewMode('all')}
          >
            All (256B)
          </button>
        </div>
      </div>
      <div className="memory-content">
        {displayMemory.length === 0 ? (
          <div className="memory-empty">
            <p>No data in memory</p>
            <p className="memory-hint">Execute a store instruction (SB, SH, SW) to see memory contents</p>
          </div>
        ) : (
          <div className="memory-grid">
            <div className="memory-grid-header">
              <span>Address</span>
              <span>Value</span>
            </div>
            {displayMemory.map((item, index) => {
              // Handle both array of objects and simple array
              const address = item?.address !== undefined ? item.address : index;
              const value = item?.value !== undefined ? item.value : item;
              
              return (
                <div key={index} className="memory-row">
                  <span className="memory-address">{formatAddress(address)}</span>
                  <span className="memory-value">{formatValue(value)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default MemoryDisplay;