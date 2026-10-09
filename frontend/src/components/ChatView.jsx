import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, Bot, User, Sparkles, ChevronDown, ChevronUp, 
  Code, CheckCircle2, HelpCircle, Lightbulb, AlertTriangle,
  ArrowRight, CornerDownLeft, RefreshCw
} from 'lucide-react';
import DynamicChart from './DynamicChart';
import CodeBlock from './CodeBlock';

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

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          history: historyPayload
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Analysis request failed');
      }

      const data = await res.json();
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
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 110px)', padding: '0 16px 16px 16px' }}>
      
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
              className="animate-fade-in"
              style={{
                display: 'flex',
                gap: '14px',
                alignItems: 'flex-start',
                justifyContent: isUser ? 'flex-end' : 'flex-start'
              }}
            >
              {/* Bot Avatar */}
              {!isUser && (
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
                }}>
                  <Bot size={18} color="#ffffff" />
                </div>
              )}

              {/* Message Bubble */}
              <div style={{
                maxWidth: isUser ? '75%' : '88%',
                background: isUser ? 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)' : '#0c1220',
                border: `1px solid ${isUser ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.08)'}`,
                borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                padding: '16px 20px',
                boxShadow: isUser ? '0 4px 15px rgba(79, 70, 229, 0.3)' : '0 8px 24px rgba(0,0,0,0.35)',
                color: '#f8fafc'
              }}>
                {isUser ? (
                  <div style={{ fontSize: '14px', fontWeight: '500', lineHeight: 1.5 }}>
                    {msg.content}
                  </div>
                ) : (
                  <div>
                    {/* Direct Answer */}
                    <div style={{ fontSize: '14px', lineHeight: 1.6, marginBottom: '12px', whiteSpace: 'pre-wrap' }}>
                      {isObj ? msg.content.answer : msg.content}
                    </div>

                    {/* Step-by-Step Reasoning Trace Accordion */}
                    {isObj && msg.content.reasoning_steps && msg.content.reasoning_steps.length > 0 && (
                      <div style={{
                        marginTop: '12px',
                        borderRadius: '10px',
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        overflow: 'hidden'
                      }}>
                        <button
                          onClick={() => toggleReasoning(idx)}
                          style={{
                            width: '100%',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '8px 12px',
                            background: 'transparent',
                            border: 'none',
                            color: '#94a3b8',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Sparkles size={13} color="#818cf8" />
                            <span>Reasoning Chain ({msg.content.reasoning_steps.length} Steps)</span>
                            {msg.content.execution_time_seconds && (
                              <span style={{ fontSize: '11px', color: '#64748b' }}>
                                • {msg.content.execution_time_seconds}s
                              </span>
                            )}
                          </div>
                          {isReasoningOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                        </button>

                        {isReasoningOpen && (
                          <div style={{ padding: '8px 12px 12px 12px', borderTop: '1px solid rgba(255, 255, 255, 0.04)' }}>
                            <div style={{ fontSize: '12px', color: '#cbd5e1', marginBottom: '10px', fontStyle: 'italic' }}>
                              "{msg.content.reasoning}"
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              {msg.content.reasoning_steps.map((step, sIdx) => (
                                <div key={sIdx} style={{
                                  display: 'flex',
                                  alignItems: 'flex-start',
                                  gap: '8px',
                                  fontSize: '11px'
                                }}>
                                  <CheckCircle2 size={13} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
                                  <div>
                                    <span style={{ fontWeight: '600', color: '#e2e8f0' }}>{step.title}: </span>
                                    <span style={{ color: '#94a3b8' }}>{step.description}</span>
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
                        background: 'rgba(16, 185, 129, 0.06)',
                        border: '1px solid rgba(16, 185, 129, 0.2)',
                        borderRadius: '10px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#34d399', fontWeight: '700', fontSize: '12px', marginBottom: '6px' }}>
                          <Lightbulb size={14} />
                          <span>Strategic Business Takeaways</span>
                        </div>
                        <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px', color: '#cbd5e1', lineHeight: 1.6 }}>
                          {msg.content.insights.map((ins, iIdx) => (
                            <li key={iIdx}>{ins}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Suggested Follow-up Questions */}
                    {isObj && msg.content.follow_up_questions && msg.content.follow_up_questions.length > 0 && (
                      <div style={{ marginTop: '14px' }}>
                        <div style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>
                          Suggested Follow-up Inquiries
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {msg.content.follow_up_questions.map((q, qIdx) => (
                            <button
                              key={qIdx}
                              onClick={() => handleSend(q)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                padding: '5px 11px',
                                background: 'rgba(99, 102, 241, 0.08)',
                                border: '1px solid rgba(99, 102, 241, 0.25)',
                                borderRadius: '9999px',
                                color: '#cbd5e1',
                                fontSize: '11px',
                                fontWeight: '500',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                              }}
                              onMouseOver={(e) => {
                                e.currentTarget.style.background = 'rgba(99, 102, 241, 0.2)';
                                e.currentTarget.style.color = '#ffffff';
                              }}
                              onMouseOut={(e) => {
                                e.currentTarget.style.background = 'rgba(99, 102, 241, 0.08)';
                                e.currentTarget.style.color = '#cbd5e1';
                              }}
                            >
                              <span>{q}</span>
                              <ArrowRight size={11} color="#818cf8" />
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
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <User size={18} color="#ffffff" />
                </div>
              )}
            </div>
          );
        })}

        {/* Loading Bubble */}
        {loading && (
          <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <RefreshCw size={18} color="#ffffff" className="animate-spin" />
            </div>
            <div style={{
              background: '#0c1220',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '12px 18px',
              fontSize: '13px',
              color: '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Sparkles size={15} color="#818cf8" />
              <span>Analyzing schema, executing vectorized DuckDB queries & synthesizing insights...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Starter Chips */}
      {messages.length === 1 && (
        <div style={{ marginBottom: '10px' }}>
          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', marginBottom: '6px' }}>
            Instant Starter Prompts
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {samplePrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(p)}
                className="btn-secondary"
                style={{ fontSize: '12px', padding: '6px 12px' }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chat Input Bar */}
      <div className="glass-panel" style={{
        padding: '10px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        background: '#0c1220'
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
          placeholder="Ask any question (e.g. 'Which region generated highest revenue?', 'Show monthly sales trends', 'Generate SQL')..."
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            resize: 'none',
            color: '#ffffff',
            fontSize: '13px',
            fontFamily: 'inherit',
            padding: '6px 4px'
          }}
        />
        <button
          onClick={() => handleSend()}
          disabled={!input.trim() || loading}
          className="btn-primary"
          style={{ padding: '8px 14px', borderRadius: '8px', opacity: !input.trim() || loading ? 0.5 : 1 }}
        >
          <Send size={15} />
          <span>Ask</span>
        </button>
      </div>
    </div>
  );
}
