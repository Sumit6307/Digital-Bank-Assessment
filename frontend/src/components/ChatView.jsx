import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, Bot, User, Sparkles, ChevronDown, ChevronUp, 
  CheckCircle2, Lightbulb, ArrowRight, RefreshCw
} from 'lucide-react';
import DynamicChart from './DynamicChart';
import CodeBlock from './CodeBlock';
import { api } from '../services/api';

export default function ChatView({ onRunInPlayground, overview }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: {
        answer: "👋 Hello! I am your **AI Chief Data Analyst** powered by DuckDB and LLM intelligence.\n\nAsk me any business or statistical question about your uploaded CSV datasets, and I will generate queries, execute them in real-time, generate charts, and uncover actionable insights!",
        reasoning: "System initialized with available in-memory data tables.",
        reasoning_steps: [
          { step_number: 1, title: "Engine Ready", description: "DuckDB vectorized in-memory database connected", status: "success" },
          { step_number: 2, title: "Schema Mapped", description: `${overview?.tables?.length || 0} datasets indexed`, status: "success" }
        ],
        insights: [
          "Try asking: 'Which region generated the highest revenue?'",
          "Try asking: 'Show monthly sales trends.'",
          "Try asking: 'Which products are underperforming?'",
          "Try asking: 'What are the top five customers?'",
          "Try asking: 'Detect anomalies in the dataset.'"
        ],
        follow_up_questions: [
          "Which region generated the highest revenue?",
          "Show monthly sales trends.",
          "Which products are underperforming?",
          "What are the top five customers?",
          "Detect anomalies in the dataset."
        ]
      }
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [openReasoningMap, setOpenReasoningMap] = useState({});
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const toggleReasoning = (idx) => {
    setOpenReasoningMap(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  const handleSend = async (questionText = null) => {
    const textToSend = questionText || input;
    if (!textToSend.trim() || loading) return;

    const userMessage = { role: 'user', content: textToSend };
    setMessages(prev => [...prev, userMessage]);
    if (!questionText) setInput('');
    setLoading(true);

    try {
      // Build conversation history format
      const historyPayload = messages.map(m => ({
        role: m.role,
        content: typeof m.content === 'string' ? m.content : m.content.answer
      }));

      const data = await api.chat({
        message: textToSend,
        history: historyPayload
      });

      setMessages(prev => [...prev, { role: 'assistant', content: data }]);
      // Open reasoning by default for new assistant response
      setOpenReasoningMap(prev => ({ ...prev, [messages.length + 1]: true }));

    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: {
            answer: `❌ **Error during analysis**: ${err.message}`,
            reasoning: "Execution encountered an error. Check table names and connection.",
            reasoning_steps: [{ step_number: 1, title: "Execution Failure", description: err.message, status: "failed" }],
            insights: ["Try rephrasing your query or verifying table column names in the Data Studio tab."]
          }
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const samplePrompts = [
    "Which region generated the highest revenue?",
    "Show monthly sales trends.",
    "Which products are underperforming?",
    "What are the top five customers?",
    "Generate SQL for this analysis.",
    "Detect anomalies in the dataset."
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 104px)' }}>
      
      {/* Messages Scroll Area */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        paddingRight: '8px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        marginBottom: '16px'
      }}>
        {messages.map((msg, idx) => {
          const isUser = msg.role === 'user';
          const isObj = typeof msg.content === 'object' && msg.content !== null;
          const isReasoningOpen = openReasoningMap[idx];

          return (
            <div
              key={idx}
              className="animate-fade-up"
              style={{
                display: 'flex',
                gap: '14px',
                alignItems: 'flex-start',
                justifyContent: isUser ? 'flex-end' : 'flex-start',
                animationDelay: `${idx * 0.05}s`
              }}
            >
              {/* Bot Avatar */}
              {!isUser && (
                <div style={{
                  width: '36px', height: '36px', borderRadius: 'var(--radius-md)',
                  background: 'linear-gradient(135deg, var(--accent) 0%, #7C3AED 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, boxShadow: '0 2px 8px rgba(79, 70, 229, 0.2)'
                }}>
                  <Bot size={18} color="#ffffff" />
                </div>
              )}

              {/* Message Bubble */}
              <div className={isUser ? '' : 'card'} style={{
                maxWidth: isUser ? '70%' : '85%',
                background: isUser ? 'var(--accent)' : 'var(--surface-primary)',
                border: isUser ? 'none' : undefined,
                borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                padding: '14px 18px',
                boxShadow: isUser ? 'var(--shadow-sm)' : undefined,
                color: isUser ? '#ffffff' : 'var(--text-primary)'
              }}>
                {isUser ? (
                  <div style={{ fontSize: '13.5px', fontWeight: '500', lineHeight: 1.55 }}>
                    {msg.content}
                  </div>
                ) : (
                  <div>
                    {/* Direct Answer */}
                    <div style={{ fontSize: '13.5px', lineHeight: 1.65, marginBottom: '10px', whiteSpace: 'pre-wrap', color: 'var(--text-primary)' }}>
                      {isObj ? msg.content.answer : msg.content}
                    </div>

                    {/* Step-by-Step Reasoning Trace Accordion */}
                    {isObj && msg.content.reasoning_steps && msg.content.reasoning_steps.length > 0 && (
                      <div style={{
                        marginTop: '10px',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-light)',
                        overflow: 'hidden'
                      }}>
                        <button
                          onClick={() => toggleReasoning(idx)}
                          style={{
                            width: '100%',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '8px 12px',
                            background: 'transparent', border: 'none',
                            color: 'var(--text-secondary)',
                            fontSize: '12px', fontWeight: '600', cursor: 'pointer',
                            fontFamily: 'inherit'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Sparkles size={13} color="var(--accent)" />
                            <span>Reasoning Chain ({msg.content.reasoning_steps.length} Steps)</span>
                            {msg.content.execution_time_seconds && (
                              <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                                • {msg.content.execution_time_seconds}s
                              </span>
                            )}
                          </div>
                          {isReasoningOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                        </button>

                        {isReasoningOpen && (
                          <div style={{ padding: '8px 12px 12px 12px', borderTop: '1px solid var(--border-light)' }}>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '10px', fontStyle: 'italic' }}>
                              "{msg.content.reasoning}"
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                              {msg.content.reasoning_steps.map((step, sIdx) => (
                                <div key={sIdx} style={{
                                  display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12px'
                                }}>
                                  <CheckCircle2 size={13} color="var(--success)" style={{ marginTop: '2px', flexShrink: 0 }} />
                                  <div>
                                    <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{step.title}: </span>
                                    <span style={{ color: 'var(--text-secondary)' }}>{step.description}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Interactive Chart */}
                    {isObj && msg.content.chart && (
                      <DynamicChart config={msg.content.chart} height={280} />
                    )}

                    {/* Generated SQL Code */}
                    {isObj && msg.content.generated_sql && (
                      <CodeBlock
                        code={msg.content.generated_sql}
                        language="sql"
                        onRun={(code) => onRunInPlayground?.(code, 'sql')}
                      />
                    )}

                    {/* Generated Python Code */}
                    {isObj && msg.content.generated_python && (
                      <CodeBlock
                        code={msg.content.generated_python}
                        language="python"
                        onRun={(code) => onRunInPlayground?.(code, 'python')}
                      />
                    )}

                    {/* Business Takeaways & Insights */}
                    {isObj && msg.content.insights && msg.content.insights.length > 0 && (
                      <div style={{
                        marginTop: '12px',
                        padding: '12px 14px',
                        background: 'var(--success-light)',
                        border: '1px solid var(--success-border)',
                        borderRadius: 'var(--radius-md)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--success)', fontWeight: '700', fontSize: '12px', marginBottom: '6px' }}>
                          <Lightbulb size={14} />
                          <span>Key Insights</span>
                        </div>
                        <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                          {msg.content.insights.map((ins, iIdx) => (
                            <li key={iIdx}>{ins}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Suggested Follow-up Questions */}
                    {isObj && msg.content.follow_up_questions && msg.content.follow_up_questions.length > 0 && (
                      <div style={{ marginTop: '14px' }}>
                        <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
                          Suggested Follow-ups
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {msg.content.follow_up_questions.map((q, qIdx) => (
                            <button
                              key={qIdx}
                              onClick={() => handleSend(q)}
                              className="btn btn-secondary btn-sm"
                              style={{ fontSize: '11.5px', fontWeight: 500 }}
                            >
                              <span>{q}</span>
                              <ArrowRight size={11} color="var(--accent)" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* User Avatar */}
              {isUser && (
                <div style={{
                  width: '36px', height: '36px', borderRadius: 'var(--radius-md)',
                  background: 'linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  <User size={18} color="#ffffff" />
                </div>
              )}
            </div>
          );
        })}

        {/* Loading Bubble */}
        {loading && (
          <div className="animate-fade-up" style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, var(--accent) 0%, #7C3AED 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <RefreshCw size={18} color="#ffffff" className="animate-spin" />
            </div>
            <div className="card" style={{
              padding: '12px 18px', fontSize: '13px', color: 'var(--text-secondary)',
              display: 'flex', alignItems: 'center', gap: '8px'
            }}>
              <Sparkles size={15} color="var(--accent)" />
              <span>Analyzing data and generating insights...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Starter Chips */}
      {messages.length === 1 && (
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
            Quick Start Prompts
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {samplePrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(p)}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '12px' }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chat Input Bar */}
      <div className="card" style={{
        padding: '10px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-md)'
      }}>
        <textarea
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Ask any question about your data..."
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            resize: 'none',
            color: 'var(--text-primary)',
            fontSize: '13px',
            fontFamily: 'inherit',
            padding: '6px 4px'
          }}
        />
        <button
          onClick={() => handleSend()}
          disabled={!input.trim() || loading}
          className="btn btn-primary"
          style={{ padding: '8px 16px', opacity: !input.trim() || loading ? 0.5 : 1 }}
        >
          <Send size={14} />
          <span>Send</span>
        </button>
      </div>
    </div>
  );
}
