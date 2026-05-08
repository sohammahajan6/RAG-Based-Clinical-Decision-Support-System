import React, { useState, useEffect, useRef } from 'react';
import {
    Moon,
    Sun,
    FileText,
    HeartPulse,
    LogOut,
    Clock,
    Shield,
    Activity,
    ChevronDown,
    ChevronUp,
    Upload,
    Trash2,
    File as FileIcon,
    Image,
    Bell,
    Check,
    X,
    Plus,
    Download,
    MessageSquare,
    Send,
    Bot,
    User as UserIcon,
    Edit,
    Save,
} from 'lucide-react';

interface UserData {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone_number?: string;
    role: string;
}

interface PatientRecord {
    _id: string;
    name: string;
    gender: string;
    Email: string;
    age: number;
    condition: string;
    description: string;
    symptoms: string;
    medications: string;
    allergies: string;
    personalHistory: string;
    familyHistory: string;
    remarks: string;
    temperature?: number;
    pulse?: number;
    bloodPressure?: string;
    latest_risk_factor?: string;
    score?: string;
    chat_history?: ChatEntry[];
    doctor_id: string;
}

interface ChatEntry {
    question: string;
    response: string;
    latest_risk_factor?: string;
    score?: string;
    timestamp: string;
}

interface Report {
    _id: string;
    report_type: string;
    report_name: string;
    notes: string;
    file_name: string;
    file_type: string;
    file_size: number;
    uploaded_at: string;
}

interface BotMessage {
    role: 'user' | 'ai';
    content: string;
    reportName?: string;
    reportType?: string;
    timestamp: Date;
}

interface PatientProfile {
    user_email: string;
    gender: string;
    dob: string;
    allergies: string;
    medications: string;
    personalHistory: string;
    familyHistory: string;
}

interface PatientDashboardProps {
    token: string;
    userData: UserData | null;
    onLogout: () => void;
    isDarkMode: boolean;
    toggleDarkMode: () => void;
}

const REPORT_TYPES = [
    'Blood Test', 'Urine Test', 'X-Ray', 'MRI Scan', 'CT Scan', 'Ultrasound',
    'ECG / EKG', 'Lipid Panel', 'Thyroid Test', 'Liver Function Test',
    'Kidney Function Test', 'CBC (Complete Blood Count)', 'HbA1c (Diabetes)',
    'Vitamin Panel', 'Allergy Test', 'Prescription', 'Discharge Summary', 'Other',
];

// Simple markdown-like formatter
const FormatAIResponse: React.FC<{ text: string }> = ({ text }) => {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];

    lines.forEach((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) {
            elements.push(<div key={i} className="h-2" />);
            return;
        }

        // Headers
        if (trimmed.startsWith('### ')) {
            elements.push(<h4 key={i} className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-3 mb-1">{formatInline(trimmed.slice(4))}</h4>);
            return;
        }
        if (trimmed.startsWith('## ')) {
            elements.push(<h3 key={i} className="text-base font-bold text-slate-800 dark:text-slate-100 mt-3 mb-1">{formatInline(trimmed.slice(3))}</h3>);
            return;
        }
        if (trimmed.startsWith('# ')) {
            elements.push(<h2 key={i} className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-3 mb-1">{formatInline(trimmed.slice(2))}</h2>);
            return;
        }

        // Numbered list
        if (/^\d+[\.\)]\s/.test(trimmed)) {
            const content = trimmed.replace(/^\d+[\.\)]\s*/, '');
            elements.push(
                <div key={i} className="flex gap-2 ml-1 mb-1">
                    <span className="text-teal-600 font-semibold text-xs mt-0.5 flex-shrink-0">{trimmed.match(/^\d+/)?.[0]}.</span>
                    <span className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">{formatInline(content)}</span>
                </div>
            );
            return;
        }

        // Bullet
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ')) {
            const content = trimmed.slice(2);
            elements.push(
                <div key={i} className="flex gap-2 ml-1 mb-1">
                    <span className="w-1.5 h-1.5 bg-teal-500 rounded-full flex-shrink-0 mt-2"></span>
                    <span className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">{formatInline(content)}</span>
                </div>
            );
            return;
        }

        // Important / disclaimer lines
        if (trimmed.toUpperCase().startsWith('IMPORTANT') || trimmed.toUpperCase().startsWith('DISCLAIMER') || trimmed.toUpperCase().startsWith('NOTE:') || trimmed.toUpperCase().startsWith('⚠')) {
            elements.push(
                <div key={i} className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-2 mb-1">
                    <p className="text-xs text-amber-700 leading-relaxed">{formatInline(trimmed)}</p>
                </div>
            );
            return;
        }

        // Normal paragraph
        elements.push(<p key={i} className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed mb-1">{formatInline(trimmed)}</p>);
    });

    return <div>{elements}</div>;
};

// Inline formatting: **bold**, *italic*, `code`
function formatInline(text: string): React.ReactNode {
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let key = 0;

    while (remaining.length > 0) {
        // Bold **text**
        const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
        if (boldMatch && boldMatch.index !== undefined) {
            if (boldMatch.index > 0) {
                parts.push(<span key={key++}>{remaining.slice(0, boldMatch.index)}</span>);
            }
            parts.push(<strong key={key++} className="font-semibold text-slate-800 dark:text-slate-100">{boldMatch[1]}</strong>);
            remaining = remaining.slice(boldMatch.index + boldMatch[0].length);
            continue;
        }

        // Code `text`
        const codeMatch = remaining.match(/`(.+?)`/);
        if (codeMatch && codeMatch.index !== undefined) {
            if (codeMatch.index > 0) {
                parts.push(<span key={key++}>{remaining.slice(0, codeMatch.index)}</span>);
            }
            parts.push(<code key={key++} className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-1.5 py-0.5 rounded text-xs font-mono">{codeMatch[1]}</code>);
            remaining = remaining.slice(codeMatch.index + codeMatch[0].length);
            continue;
        }

        parts.push(<span key={key++}>{remaining}</span>);
        break;
    }

    return <>{parts}</>;
}


const PatientDashboard: React.FC<PatientDashboardProps> = ({ token, userData, onLogout, isDarkMode, toggleDarkMode }) => {
    const [activeTab, setActiveTab] = useState('overview');
    const [records, setRecords] = useState<PatientRecord[]>([]);
    const [requests, setRequests] = useState<any[]>([]);
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedRecord, setExpandedRecord] = useState<string | null>(null);

    // Upload form state
    const [showUpload, setShowUpload] = useState(false);
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [reportType, setReportType] = useState('Blood Test');
    const [reportName, setReportName] = useState('');
    const [reportNotes, setReportNotes] = useState('');
    const [uploading, setUploading] = useState(false);
    const [uploadMsg, setUploadMsg] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Chatbot state
    const [chatInput, setChatInput] = useState('');
    const [chatMessages, setChatMessages] = useState<BotMessage[]>([]);
    const [chatLoading, setChatLoading] = useState(false);
    const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
    const [selectedReportName, setSelectedReportName] = useState('');
    const [showMentions, setShowMentions] = useState(false);
    const [mentionFilter, setMentionFilter] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);
    const chatInputRef = useRef<HTMLInputElement>(null);

    // Profile state
    const [profile, setProfile] = useState<PatientProfile>({
        user_email: '', gender: '', dob: '', allergies: '', medications: '', personalHistory: '', familyHistory: ''
    });
    const [profileSaving, setProfileSaving] = useState(false);
    const [profileMsg, setProfileMsg] = useState('');
    const [profileEditing, setProfileEditing] = useState(false);

    useEffect(() => {
        fetchMyRecords();
        fetchMyReports();
        fetchRequests();
        fetchProfile();
    }, []);

    useEffect(() => {
        if (chatMessages.length > 0) {
            setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        }
    }, [chatMessages, chatLoading]);


    const fetchRequests = async () => {
        try {
            const response = await fetch('http://localhost:8000/patient/requests', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) setRequests(await response.json());
        } catch (error) {
            console.error('Error fetching requests:', error);
        }
    };

    const handleRequestAction = async (requestId: string, action: string) => {
        try {
            const res = await fetch(`http://localhost:8000/patient/requests/${requestId}/respond?action=${action}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                fetchRequests();
                fetchMyRecords();
            }
        } catch (e) { console.error(e); }
    };

    const fetchProfile = async () => {
        try {
            const response = await fetch('http://localhost:8000/patient/profile', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setProfile(data);
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        }
    };

    const saveProfile = async () => {
        setProfileSaving(true);
        setProfileMsg('');
        try {
            const response = await fetch('http://localhost:8000/patient/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    gender: profile.gender,
                    dob: profile.dob,
                    allergies: profile.allergies,
                    medications: profile.medications,
                    personalHistory: profile.personalHistory,
                    familyHistory: profile.familyHistory,
                })
            });
            if (response.ok) {
                setProfileMsg('Profile saved successfully!');
                setProfileEditing(false);
                setTimeout(() => setProfileMsg(''), 3000);
            } else {
                setProfileMsg('Failed to save profile.');
            }
        } catch {
            setProfileMsg('Error saving profile.');
        } finally {
            setProfileSaving(false);
        }
    };

    const handleProfileChange = (field: keyof PatientProfile, value: string) => {
        setProfile(prev => ({ ...prev, [field]: value }));
    };

    const fetchMyRecords = async () => {
        try {
            const response = await fetch('http://localhost:8000/my-records', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) setRecords(await response.json());
        } catch (error) {
            console.error('Error fetching records:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMyReports = async () => {
        try {
            const response = await fetch('http://localhost:8000/my-reports', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) setReports(await response.json());
        } catch (error) {
            console.error('Error fetching reports:', error);
        }
    };

    const handleUpload = async () => {
        if (!uploadFile || !reportName.trim()) return;
        setUploading(true);
        setUploadMsg('');
        try {
            const formData = new FormData();
            formData.append('file', uploadFile);
            formData.append('report_type', reportType);
            formData.append('report_name', reportName);
            formData.append('notes', reportNotes);
            const response = await fetch('http://localhost:8000/upload-report', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData,
            });
            if (response.ok) {
                setUploadMsg('Report uploaded successfully!');
                setUploadFile(null);
                setReportName('');
                setReportNotes('');
                setShowUpload(false);
                fetchMyReports();
                fetchRequests();
            } else {
                const err = await response.json();
                setUploadMsg(err.detail || 'Upload failed');
            }
        } catch { setUploadMsg('Error uploading report'); }
        finally { setUploading(false); }
    };

    const handleDeleteReport = async (reportId: string) => {
        if (!confirm('Delete this report?')) return;
        try {
            const res = await fetch(`http://localhost:8000/report/${reportId}`, {
                method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` },
            });
            if (res.ok) fetchMyReports();
            fetchRequests();
        } catch (e) { console.error(e); }
    };

    const handleViewReport = async (reportId: string) => {
        try {
            const res = await fetch(`http://localhost:8000/report/${reportId}`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                const byteChars = atob(data.file_data);
                const byteArray = new Uint8Array(byteChars.length);
                for (let i = 0; i < byteChars.length; i++) byteArray[i] = byteChars.charCodeAt(i);
                const blob = new Blob([byteArray], { type: data.file_type });
                window.open(URL.createObjectURL(blob), '_blank');
            }
        } catch (e) { console.error(e); }
    };

    // ---- Chatbot Logic ----
    const handleChatInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setChatInput(val);

        // Detect @ mention
        const atIndex = val.lastIndexOf('@');
        if (atIndex !== -1 && (atIndex === 0 || val[atIndex - 1] === ' ')) {
            const filter = val.slice(atIndex + 1);
            // Only show mentions if there's no space after the filter (still typing the mention)
            if (!filter.includes(' ') || filter.length === 0) {
                setMentionFilter(filter.toLowerCase());
                setShowMentions(true);
                return;
            }
        }
        setShowMentions(false);
    };

    const handleMentionSelect = (report: Report) => {
        const atIndex = chatInput.lastIndexOf('@');
        const before = chatInput.slice(0, atIndex);
        setChatInput(before + `@${report.report_name} `);
        setSelectedReportId(report._id);
        setSelectedReportName(report.report_name);
        setShowMentions(false);
        chatInputRef.current?.focus();
    };

    const handleSendChat = async () => {
        if (!chatInput.trim()) return;

        let reportId = selectedReportId;
        let reportName = selectedReportName;

        // Only try to extract report mention if no report is already selected
        if (!reportId) {
            // Match against actual report names (longest match first)
            const sortedReports = [...reports].sort((a, b) => b.report_name.length - a.report_name.length);
            for (const r of sortedReports) {
                if (chatInput.toLowerCase().includes(`@${r.report_name.toLowerCase()}`)) {
                    reportId = r._id;
                    reportName = r.report_name;
                    break;
                }
            }
        }

        if (!reportId) {
            setChatMessages(prev => [...prev, {
                role: 'user', content: chatInput, timestamp: new Date()
            }, {
                role: 'ai',
                content: 'Please mention a report using **@report name** so I know which report to analyze.\n\nFor example: `@Blood Test - March 2026 explain this report`',
                timestamp: new Date()
            }]);
            setChatInput('');
            return;
        }

        // Clean question (remove @mention from it)
        const question = chatInput.replace(new RegExp(`@${reportName}\\s*`, 'i'), '').trim() || 'Explain this report in simple terms';

        setChatMessages(prev => [...prev, {
            role: 'user', content: chatInput, reportName, timestamp: new Date()
        }]);
        setChatInput('');
        setChatLoading(true);

        try {
            const res = await fetch(
                `http://localhost:8000/analyze-report?report_id=${reportId}&question=${encodeURIComponent(question)}`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            if (res.ok) {
                const data = await res.json();
                setChatMessages(prev => [...prev, {
                    role: 'ai', content: data.response, reportName: data.report_name,
                    reportType: data.report_type, timestamp: new Date()
                }]);
            } else {
                const err = await res.json();
                setChatMessages(prev => [...prev, {
                    role: 'ai', content: err.detail || 'Failed to analyze this report.', timestamp: new Date()
                }]);
            }
        } catch {
            setChatMessages(prev => [...prev, {
                role: 'ai', content: 'Error connecting to the server.', timestamp: new Date()
            }]);
        } finally {
            setChatLoading(false);
            setSelectedReportId(null);
            setSelectedReportName('');
        }
    };

    const filteredMentions = reports.filter(r =>
        r.report_name.toLowerCase().includes(mentionFilter)
    );

    // ---- Helpers ----
    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const getFileIcon = (ft: string) =>
        ft?.startsWith('image/') ? <Image className="w-5 h-5 text-purple-500" /> : <FileIcon className="w-5 h-5 text-blue-500" />;

    const getRiskColor = (r?: string) => {
        if (!r) return 'text-slate-400 dark:text-slate-500';
        const m: Record<string, string> = { critical: 'text-red-600', high: 'text-orange-500', moderate: 'text-yellow-600', low: 'text-green-600' };
        return m[r.toLowerCase()] || 'text-slate-500 dark:text-slate-400 dark:text-slate-500';
    };
    const getRiskBg = (r?: string) => {
        if (!r) return 'bg-slate-50 dark:bg-slate-950';
        const m: Record<string, string> = { critical: 'bg-red-50 border-red-200', high: 'bg-orange-50 border-orange-200', moderate: 'bg-yellow-50 border-yellow-200', low: 'bg-green-50 border-green-200' };
        return m[r.toLowerCase()] || 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800';
    };

    const latestRecord = records.length > 0 ? records[records.length - 1] : null;

    const tabs = [
        { name: 'overview', icon: Activity, label: 'Overview' },
        { name: 'profile', icon: UserIcon, label: 'My Profile' },
        { name: 'records', icon: FileText, label: 'My Records' },
        { name: 'reports', icon: Upload, label: 'My Reports' },
        { name: 'chat', icon: MessageSquare, label: 'Report AI Chat' },
        { name: 'history', icon: Clock, label: 'History' },
    ];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            {/* Top Bar */}
            <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-4 sm:px-6">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center">
                                <HeartPulse className="w-5 h-5 text-white" />
                            </div>
                            <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-100">AIsculapius</h1>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{userData?.first_name} {userData?.last_name}</p>
                                <p className="text-xs text-slate-400 dark:text-slate-500">{userData?.email}</p>
                            </div>
                            <div className="w-9 h-9 bg-teal-100 dark:bg-teal-900/50 text-teal-700 rounded-full flex items-center justify-center text-sm font-semibold">
                                {userData?.first_name?.charAt(0)}{userData?.last_name?.charAt(0)}
                            </div>
                            <button onClick={toggleDarkMode} className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors" title="Toggle Dark Mode">
                                {isDarkMode ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5" />}
                            </button>
                            <button onClick={onLogout} className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors" title="Logout">
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Tab Navigation */}
            <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                <div className="max-w-6xl mx-auto px-4 sm:px-6">
                    <nav className="flex gap-1 overflow-x-auto">
                        {tabs.map((tab) => (
                            <button
                                key={tab.name}
                                onClick={() => setActiveTab(tab.name)}
                                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.name
                                    ? 'border-teal-600 text-teal-700'
                                    : 'border-transparent text-slate-500 dark:text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:text-slate-200'
                                    }`}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>
            </div>

            {/* Main Content */}
            <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
                        <span className="ml-3 text-slate-500 dark:text-slate-400 dark:text-slate-500 text-sm">Loading...</span>
                    </div>
                ) : (
                    <>
                        {/* ========== OVERVIEW TAB ========== */}
                        {activeTab === 'overview' && (
                            <div className="space-y-6">
                                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                                    <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Hello, {userData?.first_name}!</h2>
                                    <p className="text-slate-500 dark:text-slate-400 dark:text-slate-500 text-sm mt-1">Here's a summary of your health records.</p>
                                </div>

                                {requests && requests.length > 0 && (
                                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6">
                                        <h3 className="text-lg font-semibold text-amber-800 dark:text-amber-400 mb-4 flex items-center gap-2">
                                            <Bell className="w-5 h-5" />
                                            Pending Doctor Requests
                                        </h3>
                                        <div className="space-y-3">
                                            {requests.map(req => (
                                                <div key={req._id} className="bg-white dark:bg-slate-900 rounded-lg p-4 flex items-center justify-between border border-amber-100 dark:border-amber-800/50">
                                                    <div>
                                                        <p className="font-semibold text-slate-800 dark:text-slate-100">{req.doctor_name}</p>
                                                        <p className="text-sm text-slate-500 dark:text-slate-400">Requested access to your medical records</p>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button onClick={() => handleRequestAction(req._id, 'approve')} className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1">
                                                            <Check className="w-4 h-4" /> Approve
                                                        </button>
                                                        <button onClick={() => handleRequestAction(req._id, 'reject')} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-1">
                                                            <X className="w-4 h-4" /> Reject
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {records.length === 0 ? (
                                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-10 text-center">
                                        <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                                        <h3 className="text-lg font-medium text-slate-700 dark:text-slate-200">No records yet</h3>
                                        <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">Your doctor hasn't added any medical records yet.</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            <SummaryCard icon={<FileText className="w-5 h-5 text-blue-600" />} bgIcon="bg-blue-50" value={String(records.length)} label="Total Records" />
                                            <SummaryCard icon={<HeartPulse className="w-5 h-5 text-teal-600" />} bgIcon="bg-teal-50 dark:bg-teal-900/30" value={latestRecord?.condition || '—'} label="Current Condition" />
                                            <div className={`rounded-xl border p-5 ${getRiskBg(latestRecord?.latest_risk_factor)}`}>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-white dark:bg-slate-900 rounded-lg flex items-center justify-center">
                                                        <Shield className={`w-5 h-5 ${getRiskColor(latestRecord?.latest_risk_factor)}`} />
                                                    </div>
                                                    <div>
                                                        <p className={`text-2xl font-bold capitalize ${getRiskColor(latestRecord?.latest_risk_factor)}`}>
                                                            {latestRecord?.latest_risk_factor || '—'}
                                                        </p>
                                                        <p className="text-xs text-slate-400 dark:text-slate-500">Risk Level</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
                                            <div className="flex items-center justify-between mb-3">
                                                <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">Uploaded Reports</h3>
                                                <button onClick={() => setActiveTab('reports')} className="text-sm text-teal-600 hover:text-teal-700 font-medium">View all →</button>
                                            </div>
                                            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{reports.length}</p>
                                            <p className="text-xs text-slate-400 dark:text-slate-500">Medical reports on file</p>
                                        </div>

                                        {latestRecord && (
                                            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                                                <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-4">Latest Medical Record</h3>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                                    <InfoRow label="Condition" value={latestRecord.condition} />
                                                    <InfoRow label="Symptoms" value={latestRecord.symptoms} />
                                                    <InfoRow label="Medications" value={latestRecord.medications} />
                                                    <InfoRow label="Allergies" value={latestRecord.allergies || 'None'} />
                                                    <InfoRow label="Description" value={latestRecord.description} className="sm:col-span-2" />
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        )}

                        {/* ========== RECORDS TAB ========== */}
                        {activeTab === 'records' && (
                            <div className="space-y-4">
                                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Your Medical Records</h2>
                                {records.length === 0 ? (
                                    <EmptyState icon={<FileText />} title="No medical records found." />
                                ) : records.map((record) => (
                                    <div key={record._id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                                        <button onClick={() => setExpandedRecord(expandedRecord === record._id ? null : record._id)}
                                            className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-50 dark:bg-slate-950 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                                                    <HeartPulse className="w-5 h-5 text-blue-600" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{record.condition}</p>
                                                    <p className="text-xs text-slate-400 dark:text-slate-500">{record.symptoms?.substring(0, 60)}...</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {record.latest_risk_factor && (
                                                    <span className={`text-xs font-medium capitalize px-2 py-1 rounded-full ${getRiskBg(record.latest_risk_factor)} ${getRiskColor(record.latest_risk_factor)}`}>
                                                        {record.latest_risk_factor}
                                                    </span>
                                                )}
                                                {expandedRecord === record._id ? <ChevronUp className="w-4 h-4 text-slate-400 dark:text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-400 dark:text-slate-500" />}
                                            </div>
                                        </button>
                                        {expandedRecord === record._id && (
                                            <div className="border-t border-slate-100 dark:border-slate-800/50 p-5 bg-slate-50 dark:bg-slate-950">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                                    <InfoRow label="Name" value={record.name} />
                                                    <InfoRow label="Condition" value={record.condition} />
                                                    <InfoRow label="Symptoms" value={record.symptoms} />
                                                    <InfoRow label="Medications" value={record.medications} />
                                                    <InfoRow label="Allergies" value={record.allergies || 'None'} />
                                                    <InfoRow label="Remarks" value={record.remarks || '—'} />
                                                    <InfoRow label="Description" value={record.description} className="sm:col-span-2" />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* ========== REPORTS TAB ========== */}
                        {activeTab === 'reports' && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">My Reports</h2>
                                    <button onClick={() => setShowUpload(true)}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors">
                                        <Plus className="w-4 h-4" /> Upload Report
                                    </button>
                                </div>

                                {uploadMsg && (
                                    <div className={`p-3 rounded-lg text-sm ${uploadMsg.includes('success') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                                        {uploadMsg}
                                    </div>
                                )}

                                {/* Upload Modal */}
                                {showUpload && (
                                    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
                                        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                                            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800/50">
                                                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Upload Medical Report</h3>
                                                <button onClick={() => setShowUpload(false)} className="p-1 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:text-slate-300 dark:text-slate-600"><X className="w-5 h-5" /></button>
                                            </div>
                                            <div className="p-5 space-y-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Report Type</label>
                                                    <select value={reportType} onChange={(e) => setReportType(e.target.value)}
                                                        className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500">
                                                        {REPORT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Report Name</label>
                                                    <input type="text" value={reportName} onChange={(e) => setReportName(e.target.value)} placeholder="e.g., Blood Test - March 2026"
                                                        className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500" />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Notes <span className="text-slate-400 dark:text-slate-500">(optional)</span></label>
                                                    <textarea value={reportNotes} onChange={(e) => setReportNotes(e.target.value)} placeholder="Additional notes..." rows={2}
                                                        className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none" />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">File</label>
                                                    <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={(e) => setUploadFile(e.target.files?.[0] || null)} className="hidden" />
                                                    {uploadFile ? (
                                                        <div className="flex items-center justify-between p-3 bg-teal-50 dark:bg-teal-900/30 border border-teal-200 dark:border-teal-800 rounded-lg">
                                                            <div className="flex items-center gap-2">
                                                                {getFileIcon(uploadFile.type)}
                                                                <div><p className="text-sm font-medium text-slate-700 dark:text-slate-200">{uploadFile.name}</p><p className="text-xs text-slate-400 dark:text-slate-500">{formatFileSize(uploadFile.size)}</p></div>
                                                            </div>
                                                            <button onClick={() => { setUploadFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="p-1 text-slate-400 dark:text-slate-500 hover:text-red-500"><X className="w-4 h-4" /></button>
                                                        </div>
                                                    ) : (
                                                        <button onClick={() => fileInputRef.current?.click()}
                                                            className="w-full flex flex-col items-center gap-2 p-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg hover:border-teal-400 hover:bg-teal-50 dark:bg-teal-900/30/30 transition-colors">
                                                            <Upload className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                                                            <span className="text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500">Click to select a file</span>
                                                            <span className="text-xs text-slate-400 dark:text-slate-500">PDF, JPG, PNG, DOC — max 10 MB</span>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="p-5 border-t border-slate-100 dark:border-slate-800/50 flex gap-3 justify-end">
                                                <button onClick={() => setShowUpload(false)} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 dark:text-slate-600 hover:bg-slate-100 dark:bg-slate-800 rounded-lg transition-colors">Cancel</button>
                                                <button onClick={handleUpload} disabled={!uploadFile || !reportName.trim() || uploading}
                                                    className={`px-5 py-2 text-sm font-medium text-white rounded-lg transition-colors ${!uploadFile || !reportName.trim() || uploading ? 'bg-teal-300 cursor-not-allowed' : 'bg-teal-600 hover:bg-teal-700'}`}>
                                                    {uploading ? 'Uploading...' : 'Upload Report'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Reports List */}
                                {reports.length === 0 ? (
                                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-10 text-center">
                                        <Upload className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                                        <h3 className="text-lg font-medium text-slate-700 dark:text-slate-200">No reports uploaded</h3>
                                        <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">Upload your blood tests, X-rays, and other medical reports here.</p>
                                        <button onClick={() => setShowUpload(true)} className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors">
                                            <Plus className="w-4 h-4" /> Upload Your First Report
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {reports.map((report) => (
                                            <div key={report._id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">{getFileIcon(report.file_type)}</div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{report.report_name}</p>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 dark:text-slate-600 px-2 py-0.5 rounded-full">{report.report_type}</span>
                                                            <span className="text-xs text-slate-400 dark:text-slate-500">{formatFileSize(report.file_size)}</span>
                                                            <span className="text-xs text-slate-400 dark:text-slate-500">•</span>
                                                            <span className="text-xs text-slate-400 dark:text-slate-500">{new Date(report.uploaded_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <button onClick={() => { setActiveTab('chat'); setSelectedReportId(report._id); setSelectedReportName(report.report_name); setChatInput(`@${report.report_name} `); }}
                                                        className="p-2 text-teal-500 hover:bg-teal-50 dark:bg-teal-900/30 rounded-lg transition-colors" title="Ask AI about this report">
                                                        <MessageSquare className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => handleViewReport(report._id)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="View"><Download className="w-4 h-4" /></button>
                                                    <button onClick={() => handleDeleteReport(report._id)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ========== REPORT AI CHAT TAB ========== */}
                        {activeTab === 'chat' && (
                            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 210px)', minHeight: '400px' }}>
                                {/* Chat Header */}
                                <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/50 bg-white dark:bg-slate-900">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 bg-teal-100 dark:bg-teal-900/50 rounded-lg flex items-center justify-center">
                                            <Bot className="w-5 h-5 text-teal-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Report AI Assistant</h3>
                                            <p className="text-xs text-slate-400 dark:text-slate-500">Type <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1 rounded">@</span> to select a report, then ask your question</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Messages Area */}
                                <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-4">
                                    {chatMessages.length === 0 && !selectedReportId && (
                                        <div className="flex flex-col items-center justify-center h-full text-center py-12">
                                            <div className="w-16 h-16 bg-teal-50 dark:bg-teal-900/30 rounded-2xl flex items-center justify-center mb-4">
                                                <Bot className="w-8 h-8 text-teal-500" />
                                            </div>
                                            <h3 className="text-base font-semibold text-slate-700 dark:text-slate-200 mb-1">Ask about your reports</h3>
                                            <p className="text-sm text-slate-400 dark:text-slate-500 max-w-md mb-6">
                                                I can explain your medical reports in simple terms. Type <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-teal-600">@</span> to select a report, then ask your question.
                                            </p>

                                            {reports.length > 0 ? (
                                                <div className="w-full max-w-md">
                                                    <p className="text-xs text-slate-400 dark:text-slate-500 mb-2 text-left">Your reports — click to start:</p>
                                                    <div className="space-y-2">
                                                        {reports.slice(0, 4).map((r) => (
                                                            <button key={r._id} onClick={() => { setSelectedReportId(r._id); setSelectedReportName(r.report_name); setChatInput(`@${r.report_name} Explain this report`); }}
                                                                className="w-full text-left flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-950 hover:bg-teal-50 dark:bg-teal-900/30 border border-slate-200 dark:border-slate-800 hover:border-teal-200 dark:border-teal-800 rounded-lg transition-colors">
                                                                <div className="w-8 h-8 bg-white dark:bg-slate-900 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-800">{getFileIcon(r.file_type)}</div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{r.report_name}</p>
                                                                    <p className="text-xs text-slate-400 dark:text-slate-500">{r.report_type}</p>
                                                                </div>
                                                                <MessageSquare className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="text-sm text-slate-400 dark:text-slate-500">Upload a report first from the "My Reports" tab.</p>
                                            )}
                                        </div>
                                    )}

                                    {chatMessages.map((msg, idx) => (
                                        <div key={idx} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                                            {msg.role === 'ai' && (
                                                <div className="w-7 h-7 bg-teal-100 dark:bg-teal-900/50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                                                    <Bot className="w-4 h-4 text-teal-600" />
                                                </div>
                                            )}
                                            <div className={`max-w-[80%] rounded-2xl ${msg.role === 'user'
                                                ? 'bg-teal-600 text-white px-4 py-3 rounded-br-md'
                                                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-bl-md shadow-sm'
                                                }`}>
                                                {msg.role === 'ai' && msg.reportName && (
                                                    <div className="flex items-center gap-1.5 mb-2 pb-2 border-b border-slate-100 dark:border-slate-800/50">
                                                        <FileText className="w-3.5 h-3.5 text-teal-500" />
                                                        <span className="text-xs font-medium text-teal-600">{msg.reportName}</span>
                                                        {msg.reportType && <span className="text-xs text-slate-400 dark:text-slate-500">• {msg.reportType}</span>}
                                                    </div>
                                                )}
                                                {msg.role === 'ai' ? (
                                                    <FormatAIResponse text={msg.content} />
                                                ) : (
                                                    <p className="text-sm leading-relaxed">{msg.content}</p>
                                                )}
                                                <p className={`text-xs mt-2 ${msg.role === 'user' ? 'text-teal-200' : 'text-slate-300 dark:text-slate-600'}`}>
                                                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                            {msg.role === 'user' && (
                                                <div className="w-7 h-7 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                                                    <UserIcon className="w-4 h-4 text-slate-500 dark:text-slate-400 dark:text-slate-500" />
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    {chatLoading && (
                                        <div className="flex items-start gap-3">
                                            <div className="w-7 h-7 bg-teal-100 dark:bg-teal-900/50 rounded-lg flex items-center justify-center flex-shrink-0">
                                                <Bot className="w-4 h-4 text-teal-600" />
                                            </div>
                                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex gap-1">
                                                        <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                                        <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                                        <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                                    </div>
                                                    <span className="text-xs text-slate-400 dark:text-slate-500 ml-1">Analyzing report...</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <div ref={chatEndRef} />
                                </div>

                                {/* Chat Input Bar */}
                                <div className="border-t border-slate-100 dark:border-slate-800/50 px-5 py-3 bg-white dark:bg-slate-900 relative flex-shrink-0">
                                    {/* @ Mention Dropdown */}
                                    {showMentions && filteredMentions.length > 0 && (
                                        <div className="absolute bottom-full left-5 right-5 mb-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg max-h-48 overflow-y-auto custom-scrollbar z-20">
                                            <div className="p-2">
                                                <p className="text-xs text-slate-400 dark:text-slate-500 px-2 py-1">Select a report:</p>
                                                {filteredMentions.map((r) => (
                                                    <button key={r._id} onClick={() => handleMentionSelect(r)}
                                                        className="w-full flex items-center gap-3 px-3 py-2 hover:bg-teal-50 dark:bg-teal-900/30 rounded-lg transition-colors text-left">
                                                        <div className="w-7 h-7 bg-slate-100 dark:bg-slate-800 rounded flex items-center justify-center">{getFileIcon(r.file_type)}</div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{r.report_name}</p>
                                                            <p className="text-xs text-slate-400 dark:text-slate-500">{r.report_type}</p>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Selected report indicator */}
                                    {selectedReportId && (
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="inline-flex items-center gap-1 text-xs bg-teal-50 dark:bg-teal-900/30 text-teal-700 px-2 py-1 rounded-full border border-teal-200 dark:border-teal-800">
                                                <FileText className="w-3 h-3" />
                                                {selectedReportName}
                                                <button onClick={() => { setSelectedReportId(null); setSelectedReportName(''); }} className="ml-0.5 hover:text-red-500">
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </span>
                                        </div>
                                    )}

                                    <div className="flex gap-2">
                                        <input
                                            ref={chatInputRef}
                                            type="text"
                                            value={chatInput}
                                            onChange={handleChatInputChange}
                                            onKeyDown={(e) => { if (e.key === 'Enter' && !showMentions) handleSendChat(); }}
                                            placeholder="Type @ to mention a report, then your question..."
                                            className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white dark:bg-slate-900"
                                            disabled={chatLoading}
                                        />
                                        <button onClick={handleSendChat} disabled={!chatInput.trim() || chatLoading}
                                            className={`px-4 py-2.5 rounded-xl transition-colors ${!chatInput.trim() || chatLoading ? 'bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600' : 'bg-teal-600 text-white hover:bg-teal-700'}`}>
                                            <Send className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ========== MY PROFILE TAB ========== */}
                        {activeTab === 'profile' && (
                            <div className="space-y-6">
                                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <div>
                                            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                                <UserIcon className="w-5 h-5 text-teal-600" />
                                                My Profile
                                            </h2>
                                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                                Fill in your basic information. Your doctors will see this data when viewing your records.
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => profileEditing ? saveProfile() : setProfileEditing(true)}
                                            disabled={profileSaving}
                                            className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${profileEditing
                                                ? 'bg-teal-600 hover:bg-teal-700 text-white'
                                                : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                                                }`}
                                        >
                                            {profileEditing ? (
                                                <>{profileSaving ? 'Saving...' : <><Save className="w-4 h-4" /> Save Profile</>}</>
                                            ) : (
                                                <><Edit className="w-4 h-4" /> Edit Profile</>
                                            )}
                                        </button>
                                    </div>

                                    {profileMsg && (
                                        <div className={`mb-4 p-3 rounded-lg text-sm ${profileMsg.includes('success')
                                            ? 'bg-green-50 text-green-700 border border-green-200'
                                            : 'bg-red-50 text-red-700 border border-red-200'
                                            }`}>
                                            {profileMsg}
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                        {/* Name (read-only from account) */}
                                        <div>
                                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">Full Name</label>
                                            <input
                                                type="text"
                                                value={`${userData?.first_name || ''} ${userData?.last_name || ''}`}
                                                readOnly
                                                className="w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-500 dark:text-slate-400 cursor-not-allowed"
                                            />
                                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">From your account settings</p>
                                        </div>

                                        {/* Email (read-only from account) */}
                                        <div>
                                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">Email</label>
                                            <input
                                                type="email"
                                                value={userData?.email || ''}
                                                readOnly
                                                className="w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-500 dark:text-slate-400 cursor-not-allowed"
                                            />
                                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">From your account settings</p>
                                        </div>

                                        {/* Gender */}
                                        <div>
                                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">Gender</label>
                                            {profileEditing ? (
                                                <select
                                                    value={profile.gender}
                                                    onChange={(e) => handleProfileChange('gender', e.target.value)}
                                                    className="w-full px-3 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                                                >
                                                    <option value="">Select Gender</option>
                                                    <option value="Male">Male</option>
                                                    <option value="Female">Female</option>
                                                    <option value="Other">Other</option>
                                                </select>
                                            ) : (
                                                <div className="px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-100">
                                                    {profile.gender || <span className="text-slate-400 dark:text-slate-500">Not set</span>}
                                                </div>
                                            )}
                                        </div>

                                        {/* Date of Birth */}
                                        <div>
                                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">Date of Birth</label>
                                            {profileEditing ? (
                                                <input
                                                    type="date"
                                                    value={profile.dob}
                                                    onChange={(e) => handleProfileChange('dob', e.target.value)}
                                                    className="w-full px-3 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                                                />
                                            ) : (
                                                <div className="px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-100">
                                                    {profile.dob ? new Date(profile.dob).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : <span className="text-slate-400 dark:text-slate-500">Not set</span>}
                                                </div>
                                            )}
                                        </div>

                                        {/* Allergies */}
                                        <div className="sm:col-span-2">
                                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">Known Allergies</label>
                                            {profileEditing ? (
                                                <textarea
                                                    value={profile.allergies}
                                                    onChange={(e) => handleProfileChange('allergies', e.target.value)}
                                                    placeholder="e.g., Penicillin, Peanuts, Dust..."
                                                    rows={2}
                                                    className="w-full px-3 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                                                />
                                            ) : (
                                                <div className="px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-100 min-h-[40px]">
                                                    {profile.allergies || <span className="text-slate-400 dark:text-slate-500">None specified</span>}
                                                </div>
                                            )}
                                        </div>

                                        {/* Current Medications */}
                                        <div className="sm:col-span-2">
                                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">Current Medications</label>
                                            {profileEditing ? (
                                                <textarea
                                                    value={profile.medications}
                                                    onChange={(e) => handleProfileChange('medications', e.target.value)}
                                                    placeholder="e.g., Paracetamol 500mg twice a day..."
                                                    rows={2}
                                                    className="w-full px-3 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                                                />
                                            ) : (
                                                <div className="px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-100 min-h-[40px]">
                                                    {profile.medications || <span className="text-slate-400 dark:text-slate-500">None specified</span>}
                                                </div>
                                            )}
                                        </div>

                                        {/* Personal History */}
                                        <div className="sm:col-span-2">
                                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">Personal Medical History</label>
                                            {profileEditing ? (
                                                <textarea
                                                    value={profile.personalHistory}
                                                    onChange={(e) => handleProfileChange('personalHistory', e.target.value)}
                                                    placeholder="e.g., Previous surgeries, chronic conditions, lifestyle habits..."
                                                    rows={3}
                                                    className="w-full px-3 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                                                />
                                            ) : (
                                                <div className="px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-100 min-h-[40px]">
                                                    {profile.personalHistory || <span className="text-slate-400 dark:text-slate-500">Not provided</span>}
                                                </div>
                                            )}
                                        </div>

                                        {/* Family History */}
                                        <div className="sm:col-span-2">
                                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">Family Medical History</label>
                                            {profileEditing ? (
                                                <textarea
                                                    value={profile.familyHistory}
                                                    onChange={(e) => handleProfileChange('familyHistory', e.target.value)}
                                                    placeholder="e.g., Diabetes in parents, heart disease in grandparents..."
                                                    rows={3}
                                                    className="w-full px-3 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                                                />
                                            ) : (
                                                <div className="px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-100 min-h-[40px]">
                                                    {profile.familyHistory || <span className="text-slate-400 dark:text-slate-500">Not provided</span>}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {profileEditing && (
                                        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                                            <p className="text-xs text-slate-400 dark:text-slate-500">
                                                <Shield className="w-3 h-3 inline mr-1" />
                                                Your data is only visible to doctors you approve.
                                            </p>
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={() => { setProfileEditing(false); fetchProfile(); }}
                                                    className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={saveProfile}
                                                    disabled={profileSaving}
                                                    className={`px-5 py-2 text-sm font-medium text-white rounded-lg transition-colors ${profileSaving ? 'bg-teal-300 cursor-not-allowed' : 'bg-teal-600 hover:bg-teal-700'}`}
                                                >
                                                    {profileSaving ? 'Saving...' : 'Save Changes'}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Info card about what doctors can see */}
                                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-5">
                                    <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
                                        <Shield className="w-4 h-4" />
                                        How Profile Linking Works
                                    </h3>
                                    <ul className="text-sm text-blue-700 dark:text-blue-300/80 space-y-1.5">
                                        <li>• <strong>You fill</strong>: Gender, DOB, allergies, medications, personal & family history</li>
                                        <li>• <strong>Your doctor fills</strong>: Temperature, pulse, BP, height, weight, condition, symptoms, diagnosis</li>
                                        <li>• When a doctor links to you, they can see your self-reported info <strong>live</strong> — updates you make are reflected immediately</li>
                                    </ul>
                                </div>
                            </div>
                        )}

                        {/* ========== HISTORY TAB ========== */}
                        {activeTab === 'history' && (
                            <div className="space-y-4">
                                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Consultation History</h2>
                                {records.filter(r => r.chat_history && r.chat_history.length > 0).length === 0 ? (
                                    <EmptyState icon={<Clock />} title="No consultation history yet." subtitle="Your doctor's AI consultations about your case will appear here." />
                                ) : records.filter(r => r.chat_history && r.chat_history.length > 0).map((record) => (
                                    <div key={record._id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
                                        <div className="flex items-center gap-2 mb-4">
                                            <HeartPulse className="w-4 h-4 text-teal-600" />
                                            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{record.condition} — {record.name}</h3>
                                        </div>
                                        <div className="space-y-3">
                                            {record.chat_history?.map((entry, idx) => (
                                                <div key={idx} className="border border-slate-100 dark:border-slate-800/50 rounded-lg p-4 bg-slate-50 dark:bg-slate-950">
                                                    <div className="flex items-start gap-3">
                                                        <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                                            <span className="text-xs font-bold">Q</span>
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="text-sm text-slate-700 dark:text-slate-200 font-medium">{entry.question}</p>
                                                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{entry.timestamp ? new Date(entry.timestamp).toLocaleString() : ''}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-start gap-3 mt-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                                                        <div className="w-6 h-6 bg-teal-100 dark:bg-teal-900/50 text-teal-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                                            <span className="text-xs font-bold">A</span>
                                                        </div>
                                                        <div className="flex-1">
                                                            <FormatAIResponse text={typeof entry.response === 'string' ? entry.response : 'Response available'} />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
};

// ---- Sub-components ----
const InfoRow: React.FC<{ label: string; value: string; className?: string }> = ({ label, value, className = '' }) => (
    <div className={className}>
        <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mb-0.5">{label}</p>
        <p className="text-sm text-slate-700 dark:text-slate-200">{value || '—'}</p>
    </div>
);

const SummaryCard: React.FC<{ icon: React.ReactNode; bgIcon: string; value: string; label: string }> = ({ icon, bgIcon, value, label }) => (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
        <div className="flex items-center gap-3">
            <div className={`w-10 h-10 ${bgIcon} rounded-lg flex items-center justify-center`}>{icon}</div>
            <div>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{value}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">{label}</p>
            </div>
        </div>
    </div>
);

const EmptyState: React.FC<{ icon: React.ReactNode; title: string; subtitle?: string }> = ({ icon, title, subtitle }) => (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-10 text-center">
        <div className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3 flex items-center justify-center">{icon}</div>
        <p className="text-slate-500 dark:text-slate-400 dark:text-slate-500">{title}</p>
        {subtitle && <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">{subtitle}</p>}
    </div>
);

export default PatientDashboard;
