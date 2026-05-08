import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import {
    ChevronDown,
    ChevronRight,
    Send,
    User,
    Bot,
    Activity,
    AlertTriangle,
    Pill,
    Heart,
    FileText,
    Clock,
    ShieldAlert,
    Stethoscope
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────
interface PatientInfo {
    name: string;
    age: number;
    gender: string;
    condition: string;
    symptoms: string;
    medications: string;
    allergies: string;
    personalHistory: string;
    familyHistory: string;
    remarks: string;
    Email?: string;
    score?: string;
    latest_risk_factor?: string;
}

interface ResponseData {
    query: string;
    patient_info: PatientInfo;
    response: string[] | string;
    confidence_score?: number;
}

interface StructuredData {
    patientInfo: PatientInfo;
    responseText: string;
    severityLevel: string;
    confidenceScore?: number;
}

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'patient';
    timestamp: Date;
    structuredData?: StructuredData;
}

interface ChatProps {
    isDarkMode: boolean;
    patientId: string;
}

// ─── Sub-components ──────────────────────────────────────────────────

/** Collapsible section wrapper */
const CollapsibleSection: React.FC<{
    title: string;
    icon: React.ReactNode;
    badge?: React.ReactNode;
    defaultOpen?: boolean;
    isDarkMode: boolean;
    children: React.ReactNode;
}> = ({ title, icon, badge, defaultOpen = true, isDarkMode, children }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className={`rounded-lg border overflow-hidden mb-3 ${isDarkMode ? 'border-gray-600/50 bg-gray-800/60' : 'border-gray-200 bg-white'
            }`}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${isDarkMode
                    ? 'hover:bg-gray-700/50'
                    : 'hover:bg-gray-50'
                    }`}
            >
                <div className="flex items-center gap-2.5">
                    <span className={`${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>{icon}</span>
                    <span className={`font-semibold text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                        {title}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    {badge}
                    {isOpen
                        ? <ChevronDown className={`w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                        : <ChevronRight className={`w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                    }
                </div>
            </button>
            {isOpen && (
                <div className={`px-4 pb-4 pt-1 border-t ${isDarkMode ? 'border-gray-700/50' : 'border-gray-100'}`}>
                    {children}
                </div>
            )}
        </div>
    );
};

/** Single patient info field */
const InfoField: React.FC<{
    icon: string;
    label: string;
    value: string | number;
    isDarkMode: boolean;
}> = ({ icon, label, value, isDarkMode }) => {
    const displayValue = value === undefined || value === null || value === '' || value === 0 || value === 'N/A'
        ? 'N/A'
        : String(value);

    return (
        <div className={`flex items-start gap-2 py-1.5 px-2 rounded-md ${isDarkMode ? 'hover:bg-gray-700/30' : 'hover:bg-gray-50'
            }`}>
            <span className="text-base flex-shrink-0 mt-0.5">{icon}</span>
            <div className="min-w-0">
                <span className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {label}
                </span>
                <p className={`text-sm leading-snug ${displayValue === 'N/A'
                    ? (isDarkMode ? 'text-gray-500 italic' : 'text-gray-400 italic')
                    : (isDarkMode ? 'text-gray-200' : 'text-gray-800')
                    }`}>
                    {displayValue}
                </p>
            </div>
        </div>
    );
};

/** Patient info grid */
const PatientInfoCard: React.FC<{
    info: PatientInfo;
    isDarkMode: boolean;
}> = ({ info, isDarkMode }) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
        <InfoField icon="👤" label="Name" value={info.name} isDarkMode={isDarkMode} />
        <InfoField icon="📅" label="Age" value={info.age ? `${info.age} yrs` : ''} isDarkMode={isDarkMode} />
        <InfoField icon="⚧" label="Gender" value={info.gender === 'Unknown' ? '' : info.gender} isDarkMode={isDarkMode} />
        <InfoField icon="🏥" label="Condition" value={info.condition} isDarkMode={isDarkMode} />
        <InfoField icon="🤒" label="Symptoms" value={info.symptoms} isDarkMode={isDarkMode} />
        <InfoField icon="💊" label="Medications" value={info.medications} isDarkMode={isDarkMode} />
        <InfoField icon="⚠️" label="Allergies" value={info.allergies || 'None'} isDarkMode={isDarkMode} />
        <InfoField icon="📝" label="Personal History" value={info.personalHistory} isDarkMode={isDarkMode} />
        <InfoField icon="👪" label="Family History" value={info.familyHistory} isDarkMode={isDarkMode} />
        <InfoField icon="📋" label="Remarks" value={info.remarks} isDarkMode={isDarkMode} />
    </div>
);

/** Severity badge component */
const SeverityBadge: React.FC<{ level: string }> = ({ level }) => {
    if (!level) return null;
    const lower = level.toLowerCase();
    const colorMap: Record<string, string> = {
        critical: 'bg-red-100 text-red-700 border-red-200',
        severe: 'bg-orange-100 text-orange-700 border-orange-200',
        moderate: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        mild: 'bg-green-100 text-green-700 border-green-200',
    };
    const classes = colorMap[lower] || 'bg-gray-100 text-gray-700 border-gray-200';
    return (
        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border uppercase tracking-wide ${classes}`}>
            {level}
        </span>
    );
};

/** Confidence score display */
const ConfidenceScore: React.FC<{
    score: number;
    isDarkMode: boolean;
}> = ({ score, isDarkMode }) => {
    const emoji = score > 4 ? '🟢' : score > 2.5 ? '🟡' : '🔴';
    return (
        <div className={`inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full mt-3 ${isDarkMode ? 'bg-gray-700/50 text-gray-300' : 'bg-gray-100 text-gray-600'
            }`}>
            <span>{emoji}</span>
            <span>Confidence: {score.toFixed(2)}</span>
        </div>
    );
};

/** Medical assessment card — renders markdown cleanly */
const MedicalAssessmentCard: React.FC<{
    responseText: string;
    isDarkMode: boolean;
}> = ({ responseText, isDarkMode }) => {
    if (!responseText) return null;
    return (
        <div className={`prose prose-sm max-w-none ${isDarkMode ? 'prose-invert' : ''}`}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
                components={{
                    h1: ({ node, ...props }) => <h3 className={`text-base font-bold mt-4 mb-2 pb-1 border-b ${isDarkMode ? 'border-gray-600 text-gray-100' : 'border-gray-200 text-gray-900'}`} {...props} />,
                    h2: ({ node, ...props }) => <h3 className={`text-base font-bold mt-4 mb-2 pb-1 border-b ${isDarkMode ? 'border-gray-600 text-gray-100' : 'border-gray-200 text-gray-900'}`} {...props} />,
                    h3: ({ node, ...props }) => <h4 className={`text-sm font-semibold mt-3 mb-1.5 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`} {...props} />,
                    p: ({ node, ...props }) => <p className={`text-sm leading-relaxed mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`} {...props} />,
                    ul: ({ node, ...props }) => <ul className="space-y-1 mb-3 pl-1" {...props} />,
                    ol: ({ node, ...props }) => <ol className="space-y-1 mb-3 pl-4 list-decimal" {...props} />,
                    li: ({ node, ...props }) => (
                        <li className={`text-sm flex items-start gap-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${isDarkMode ? 'bg-blue-400' : 'bg-blue-500'}`} />
                            <span {...props} />
                        </li>
                    ),
                    strong: ({ node, ...props }) => <strong className={`font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`} {...props} />,
                    blockquote: ({ node, ...props }) => (
                        <blockquote className={`border-l-3 pl-3 my-2 italic ${isDarkMode ? 'border-blue-500/50 text-gray-400' : 'border-blue-300 text-gray-500'}`} {...props} />
                    ),
                }}
            >
                {responseText}
            </ReactMarkdown>
        </div>
    );
};

/** Structured AI response card */
const AIResponseCard: React.FC<{
    data: StructuredData;
    messageId: string;
    isDarkMode: boolean;
}> = ({ data, messageId, isDarkMode }) => (
    <div className="space-y-2">
        {/* Patient Information Section */}
        <CollapsibleSection
            title="Patient Information"
            icon={<User className="w-4 h-4" />}
            defaultOpen={true}
            isDarkMode={isDarkMode}
        >
            <PatientInfoCard info={data.patientInfo} isDarkMode={isDarkMode} />
        </CollapsibleSection>

        {/* Medical Assessment Section */}
        {data.responseText && (
            <CollapsibleSection
                title="Medical Assessment"
                icon={<Stethoscope className="w-4 h-4" />}
                badge={<SeverityBadge level={data.severityLevel} />}
                defaultOpen={true}
                isDarkMode={isDarkMode}
            >
                <MedicalAssessmentCard responseText={data.responseText} isDarkMode={isDarkMode} />
            </CollapsibleSection>
        )}

        {/* Confidence Score */}
        {data.confidenceScore !== undefined && (
            <ConfidenceScore score={data.confidenceScore} isDarkMode={isDarkMode} />
        )}
    </div>
);


// ─── Main Chat Component ─────────────────────────────────────────────
const Chat: React.FC<ChatProps> = ({ isDarkMode, patientId }) => {
    const [question, setQuestion] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Focus input on component mount
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    // Add welcome message
    useEffect(() => {
        if (messages.length === 0) {
            setMessages([{
                id: 'welcome',
                text: "Hello! I'm your **Patient AI Assistant**. Ask me any clinical question about this patient — I'll analyze their data and provide evidence-based insights.",
                sender: 'patient',
                timestamp: new Date()
            }]);
        }
    }, []);

    const handleSendQuestion = async () => {
        if (!question.trim()) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            text: question,
            sender: 'user',
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);

        try {
            const response = await fetch(
                `http://localhost:8000/query_patient/?question=${encodeURIComponent(question)}&patient_id=${patientId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
                    }
                }
            );

            if (response.ok) {
                const data: ResponseData = await response.json();
                const msgId = (Date.now() + 1).toString();

                let responseText = "";
                let severityLevel = "";

                if (Array.isArray(data.response)) {
                    responseText = data.response[0] || "";
                    if (data.response.length > 1) {
                        severityLevel = data.response[1];
                    }
                } else {
                    responseText = data.response;
                }

                const patientMessage: Message = {
                    id: msgId,
                    text: responseText,
                    sender: 'patient',
                    timestamp: new Date(),
                    structuredData: {
                        patientInfo: data.patient_info,
                        responseText,
                        severityLevel,
                        confidenceScore: data.confidence_score
                    }
                };

                setMessages(prev => [...prev, patientMessage]);
            } else {
                setMessages(prev => [...prev, {
                    id: (Date.now() + 1).toString(),
                    text: "Sorry, I couldn't process your question. Please try again.",
                    sender: 'patient',
                    timestamp: new Date()
                }]);
            }
        } catch (error) {
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                text: "Sorry, there was an error connecting to the server. Please try again later.",
                sender: 'patient',
                timestamp: new Date()
            }]);
            console.error('Error querying patient AI:', error);
        } finally {
            setIsLoading(false);
            setQuestion('');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendQuestion();
        }
    };

    const formatTime = (date: Date): string =>
        date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
        <div className={`flex flex-col h-[calc(100vh-8rem)] ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
            {/* ── Header ── */}
            <div className={`flex-shrink-0 px-6 py-4 border-b ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDarkMode ? 'bg-blue-900/40' : 'bg-blue-50'}`}>
                            <Bot className={`w-5 h-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                        </div>
                        <div>
                            <h1 className={`text-lg font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                                Patient AI Assistant
                            </h1>
                            <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                ID: {patientId ? `${patientId.substring(0, 10)}...` : 'Unknown'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className={`text-xs font-medium ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                            Active
                        </span>
                    </div>
                </div>
            </div>

            {/* ── Messages Area ── */}
            <div className={`flex-1 overflow-y-auto px-4 py-4 space-y-4 custom-scrollbar ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        {/* AI avatar */}
                        {message.sender === 'patient' && (
                            <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mr-2 mt-1 ${isDarkMode ? 'bg-blue-900/40' : 'bg-blue-50'
                                }`}>
                                <Bot className={`w-4 h-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                            </div>
                        )}

                        <div className={`max-w-[85%] ${message.sender === 'user' ? '' : ''}`}>
                            {/* Message bubble */}
                            <div className={`rounded-2xl px-4 py-3 ${message.sender === 'user'
                                ? 'bg-blue-600 text-white rounded-br-md'
                                : isDarkMode
                                    ? 'bg-gray-800 border border-gray-700 rounded-bl-md'
                                    : 'bg-white border border-gray-200 shadow-sm rounded-bl-md'
                                }`}>

                                {/* Structured AI response */}
                                {message.sender === 'patient' && message.structuredData ? (
                                    <AIResponseCard
                                        data={message.structuredData}
                                        messageId={message.id}
                                        isDarkMode={isDarkMode}
                                    />
                                ) : (
                                    /* Plain text / markdown message */
                                    <div className={message.sender === 'user' ? '' : ''}>
                                        <ReactMarkdown
                                            remarkPlugins={[remarkGfm]}
                                            rehypePlugins={[rehypeRaw]}
                                            components={{
                                                p: ({ node, ...props }) => <p className={`text-sm leading-relaxed ${message.sender === 'user' ? 'text-white' : isDarkMode ? 'text-gray-300' : 'text-gray-700'}`} {...props} />,
                                                strong: ({ node, ...props }) => <strong className="font-semibold" {...props} />,
                                            }}
                                        >
                                            {message.text}
                                        </ReactMarkdown>
                                    </div>
                                )}
                            </div>

                            {/* Timestamp */}
                            <p className={`text-[10px] mt-1 px-1 ${message.sender === 'user'
                                ? 'text-right'
                                : ''
                                } ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                {formatTime(message.timestamp)}
                            </p>
                        </div>

                        {/* User avatar */}
                        {message.sender === 'user' && (
                            <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ml-2 mt-1 ${isDarkMode ? 'bg-blue-600/30' : 'bg-blue-100'
                                }`}>
                                <User className={`w-4 h-4 ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`} />
                            </div>
                        )}
                    </div>
                ))}

                {/* Loading indicator */}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mr-2 mt-1 ${isDarkMode ? 'bg-blue-900/40' : 'bg-blue-50'
                            }`}>
                            <Bot className={`w-4 h-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                        </div>
                        <div className={`rounded-2xl rounded-bl-md px-5 py-4 ${isDarkMode
                            ? 'bg-gray-800 border border-gray-700'
                            : 'bg-white border border-gray-200 shadow-sm'
                            }`}>
                            <div className="flex items-center gap-2">
                                <div className="flex space-x-1">
                                    <div className={`w-2 h-2 rounded-full animate-bounce ${isDarkMode ? 'bg-blue-400' : 'bg-blue-500'}`} style={{ animationDelay: '0ms' }} />
                                    <div className={`w-2 h-2 rounded-full animate-bounce ${isDarkMode ? 'bg-blue-400' : 'bg-blue-500'}`} style={{ animationDelay: '150ms' }} />
                                    <div className={`w-2 h-2 rounded-full animate-bounce ${isDarkMode ? 'bg-blue-400' : 'bg-blue-500'}`} style={{ animationDelay: '300ms' }} />
                                </div>
                                <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                    Analyzing patient data...
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* ── Input Area ── */}
            <div className={`flex-shrink-0 px-4 py-3 border-t ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <div className="flex items-end gap-2">
                    <textarea
                        ref={inputRef}
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type your question here..."
                        className={`flex-1 px-4 py-3 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm min-h-[48px] max-h-32 ${isDarkMode
                            ? 'bg-gray-700 text-gray-100 placeholder-gray-400 border border-gray-600'
                            : 'bg-gray-100 text-gray-900 placeholder-gray-500 border border-transparent'
                            }`}
                        rows={1}
                        onInput={(e) => {
                            const target = e.target as HTMLTextAreaElement;
                            target.style.height = 'auto';
                            target.style.height = Math.min(target.scrollHeight, 128) + 'px';
                        }}
                    />
                    <button
                        onClick={handleSendQuestion}
                        disabled={isLoading || !question.trim()}
                        className={`flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 ${isLoading || !question.trim()
                            ? isDarkMode
                                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg active:scale-95'
                            }`}
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
                <p className={`text-[10px] mt-1.5 px-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    Press Enter to send · Shift+Enter for new line
                </p>
            </div>
        </div>
    );
};

export default Chat;