import React, { useRef, useEffect } from 'react';
import './Editor.css';

// Added default value [] to the instructions prop for safety
function Editor({ code, setCode, instructions = [], pc }) {
  const codeEditorRef = useRef(null);

  // --- FIX: Ensure code is a string, preventing TypeError: Cannot read properties of undefined (reading 'split') ---
  const safeCode = code || '';
  const lines = safeCode.split('\n');
  // -------------------------------------------------------------------------------------------------------------------
  
  // Create a map from source line number (1-based) to instruction index (0-based)
  const lineNumToInstructionIndex = {};
  instructions.forEach(inst => {
    lineNumToInstructionIndex[inst.lineNum] = inst.index;
  });

  const handleInput = (e) => {
    // Get all text content and update the parent state
    setCode(e.target.innerText);
  };

  // Scroll handler to sync line numbers and code display
  const handleScroll = () => {
    if (codeEditorRef.current) {
        const scrollTop = codeEditorRef.current.scrollTop;
        const lineNumbersElement = codeEditorRef.current.previousElementSibling.querySelector('.line-numbers-pre');
        if (lineNumbersElement) {
            lineNumbersElement.scrollTop = scrollTop;
        }
    }
  }

  // Effect to scroll the view to the active line when PC changes
  useEffect(() => {
    if (codeEditorRef.current && pc !== undefined) {
      // Safely check instructions array for existence
      const activeInstruction = instructions.find(inst => inst.index === pc);
      if (activeInstruction) {
        // Calculate the scroll position for the line
        const lineHeight = 21; // From Editor.css (font-size 14px * line-height 1.5)
        const activeLineTop = (activeInstruction.lineNum - 1) * lineHeight;
        const containerHeight = codeEditorRef.current.clientHeight;
        
        // Scroll to keep the active line roughly one-third down from the top
        codeEditorRef.current.scrollTop = Math.max(0, activeLineTop - containerHeight / 3);
      }
    }
  }, [pc, instructions]);
  

  return (
    <div className="editor-container">
      <div className="editor-header">
        <h2>Assembly Editor</h2>
      </div>
      <div className="editor-body">
        <div className="line-numbers">
          {/* Use pre tag wrapper to inherit font styles/spacing */}
          <pre className="line-numbers-pre">
            {lines.map((_, index) => {
              const lineNum = index + 1;
              const instructionIndex = lineNumToInstructionIndex[lineNum];
              const isActive = instructionIndex === pc;
              return (
                <span
                  key={lineNum}
                  className={`line-number-item ${isActive ? 'active-line-number' : ''}`}
                >
                  {lineNum}
                </span>
              );
            })}
          </pre>
        </div>
        
        {/* Main code display/input area using contentEditable for line highlight control */}
        <div 
          ref={codeEditorRef}
          className="code-display"
          contentEditable
          onInput={handleInput}
          onScroll={handleScroll}
          suppressContentEditableWarning
          spellCheck="false"
          // Set initial content
          dangerouslySetInnerHTML={{ __html: lines.map((line, index) => {
            const lineNum = index + 1;
            const instructionIndex = lineNumToInstructionIndex[lineNum];
            const isActive = instructionIndex === pc;
            
            return (
                `<div class="code-line ${isActive ? 'active-instruction' : ''}">${line}</div>`
            );
          }).join('') }}
        />
      </div>
    </div>
  );
}

export default Editor;