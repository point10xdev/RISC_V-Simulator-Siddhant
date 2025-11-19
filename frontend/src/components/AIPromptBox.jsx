import React, { useState } from 'react';
import './AIPromptBox.css';

function AIPromptBox({ currentCode, onGenerate, onError }) {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async () => {
    if (prompt.trim() === '') return;
    
    setIsLoading(true);
    onError(''); // Clear any previous error

    try {
      // The actual API call is handled by the onGenerate prop function in App.js
      await onGenerate(prompt, currentCode);
      // We only clear the prompt input if the API call was successful 
      // (error handling/setting happens inside App.js and its passed onError)
      setPrompt('');
    } catch (e) {
        // Error handling is primarily handled by the onGenerate wrapper
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="ai-prompt-box">
      <div className="prompt-header">
        <h3>AI Assistant (Gemini)</h3>
      </div>
      <textarea
        className="prompt-input"
        placeholder="e.g., 'Add 10 and 20 and store the result in register t0'"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        rows="3"
        disabled={isLoading}
      />
      <button
        className="btn btn-generate"
        onClick={handleGenerate}
        disabled={isLoading || prompt.trim() === ''}
      >
        {isLoading ? 'Generating...' : 'Generate Instruction'}
      </button>
      <p className="ai-disclaimer">
        *Powered by Gemini. Requires API key set in backend's `.env` file.
      </p>
    </div>
  );
}

export default AIPromptBox;