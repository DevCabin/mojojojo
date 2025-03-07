"use client";

import React, { useState, useEffect } from 'react';
import { useVoice, VoiceReadyState } from "@humeai/voice-react";
import { ClaudeService } from '../services/claude';
import { Message } from './Messages';

interface ControlsProps {
  claudeService: ClaudeService;
  onNewMessage: (message: Message) => void;
}

export default function Controls({ claudeService, onNewMessage }: ControlsProps) {
  const { connect, disconnect, readyState } = useVoice();
  const [error, setError] = useState<string | null>(null);
  const [textInput, setTextInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { startRecording, stopRecording, transcription } = useVoice();

  const handleStartRecording = async () => {
    setIsRecording(true);
    await startRecording();
  };

  const handleStopRecording = async () => {
    setIsRecording(false);
    await stopRecording();
  };

  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return;
    
    try {
      setIsProcessing(true);
      // Add user message to chat
      onNewMessage({ role: 'user', content: message.trim() });
      
      // Get Claude's response
      const response = await claudeService.sendMessage(message);
      // Add Claude's response to chat
      onNewMessage({ role: 'assistant', content: response });
    } catch (error) {
      console.error('Error sending message to Claude:', error);
      setError('Failed to get response from Claude. Please try again.');
    } finally {
      setIsProcessing(false);
      setTextInput('');
    }
  };

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleSendMessage(textInput);
  };

  // When transcription is ready, send it to Claude
  useEffect(() => {
    if (transcription) {
      handleSendMessage(transcription);
    }
  }, [transcription]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleTextSubmit(e);
    }
  };

  if (readyState === VoiceReadyState.OPEN) {
    return (
      <div className="fixed bottom-0 left-0 right-0 flex flex-col items-center gap-4 bg-white p-4 border-t border-gray-200">
        {error && (
          <div className="text-red-500 mb-4">{error}</div>
        )}
        
        <form onSubmit={handleTextSubmit} className="flex flex-col gap-2 w-full max-w-4xl px-4">
          <div className="flex gap-2 w-full">
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
              className="flex-1 p-3 border rounded-lg resize-none h-[60px] focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isProcessing}
            />
            <button
              type="submit"
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 h-[60px]"
              disabled={isProcessing || !textInput.trim()}
            >
              Send
            </button>
          </div>
        </form>

        <div className="flex gap-2">
          <button
            onClick={() => disconnect()}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            End Session
          </button>
          
          {!isRecording ? (
            <button
              onClick={handleStartRecording}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              disabled={isProcessing}
            >
              Start Recording
            </button>
          ) : (
            <button
              onClick={handleStopRecording}
              className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
            >
              Stop Recording
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full mt-4">
      {error && (
        <div className="text-red-500 mb-4">{error}</div>
      )}
      <button
        onClick={() => {
          setError(null);
          connect()
            .then(() => {
              console.log("Connected successfully");
            })
            .catch((error) => {
              console.error("Connection failed:", error);
              setError(error.message || "Failed to connect. Please try again.");
            });
        }}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Start Session
      </button>
    </div>
  );
} 