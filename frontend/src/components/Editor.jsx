import React from 'react';
import './Editor.css';

function Editor({ code, setCode }) {
  const handleChange = (e) => {
    setCode(e.target.value);
  };

  // Add line numbers
  const lines = code.split('\n');
  const lineNumbers = lines.map((_, index) => index + 1).join('\n');

  return (
    <div className="editor-container">
      <div className="editor-header">
        <h2>Assembly Editor</h2>
      </div>
      <div className="editor-body">
        <div className="line-numbers">
          <pre>{lineNumbers}</pre>
        </div>
        <textarea
          className="code-editor"
          value={code}
          onChange={handleChange}
          spellCheck="false"
          placeholder="Enter RISC-V assembly code here..."
        />
      </div>
    </div>
  );
}

export default Editor;