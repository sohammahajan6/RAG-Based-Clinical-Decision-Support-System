import React, { useEffect, useState } from 'react';
import {
    User,
    HeartPulse,
    FileText,
    Bookmark,
    Shield,
    BadgeInfo,
    MessageSquare,
    Upload,
    Download,
    Image,
    Edit2,
    Save,
    X
} from 'lucide-react';
import Chat from './Chat'; // Import Chat component

interface PatientData {
    _id: string;
    name: string;
    gender: string;
    Email?: string;
    condition: string;
    description: string;
    age: number;
    dob?: string;
    symptoms: string;
    medications: string;
    allergies: string;
    personalHistory: string;
    familyHistory: string;
    remarks: string;
    temperature?: number;
    pulse?: number;
    bloodPressure?: string;
    height?: number;
    weight?: number;
    latest_risk_factor?: string;
    score?: string;
}

interface PatientProps {
    token: string;
    isDarkMode: boolean;
    patient: PatientData;
    onChatClick?: () => void;
}

const Patient: React.FC<PatientProps> = ({ token, isDarkMode, patient: initialPatient }) => {
    const [activeTab, setActiveTab] = useState('overview');
    const [patientData, setPatientData] = useState<PatientData | null>(initialPatient);
    const [reports, setReports] = useState<any[]>([]);
    const [loadingReports, setLoadingReports] = useState(false);

    // Medical Edit State
    const [isEditingMedical, setIsEditingMedical] = useState(false);
    const [savingMedical, setSavingMedical] = useState(false);
    const [medicalMessage, setMedicalMessage] = useState('');
    const [medicalForm, setMedicalForm] = useState({
        temperature: '',
        pulse: '',
        bloodPressure: '',
        height: '',
        weight: '',
        condition: '',
        description: '',
        symptoms: '',
        remarks: ''
    });

    const startEditingMedical = () => {
        setMedicalForm({
            temperature: patientData?.temperature?.toString() || '',
            pulse: patientData?.pulse?.toString() || '',
            bloodPressure: patientData?.bloodPressure || '',
            height: patientData?.height?.toString() || '',
            weight: patientData?.weight?.toString() || '',
            condition: patientData?.condition && patientData.condition !== 'Linked Profile' ? patientData.condition : '',
            description: patientData?.description && patientData.description !== 'Patient linked via profile request.' ? patientData.description : '',
            symptoms: patientData?.symptoms || '',
            remarks: patientData?.remarks || ''
        });
        setIsEditingMedical(true);
        setMedicalMessage('');
    };

    const handleMedicalChange = (field: string, value: string) => {
        setMedicalForm(prev => ({ ...prev, [field]: value }));
    };

    const saveMedicalInfo = async () => {
        setSavingMedical(true);
        setMedicalMessage('');
        try {
            const updateData = {
                temperature: medicalForm.temperature ? parseFloat(medicalForm.temperature) : null,
                pulse: medicalForm.pulse ? parseInt(medicalForm.pulse) : null,
                bloodPressure: medicalForm.bloodPressure || null,
                height: medicalForm.height ? parseFloat(medicalForm.height) : null,
                weight: medicalForm.weight ? parseFloat(medicalForm.weight) : null,
                condition: medicalForm.condition || null,
                description: medicalForm.description || null,
                symptoms: medicalForm.symptoms || null,
                remarks: medicalForm.remarks || null,
            };

            const response = await fetch(`http://localhost:8000/patient/${patientData?._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updateData)
            });

            if (response.ok) {
                setMedicalMessage('Information saved successfully!');
                setPatientData(prev => prev ? { ...prev, ...updateData } as PatientData : null);
                setTimeout(() => {
                    setIsEditingMedical(false);
                    setMedicalMessage('');
                }, 1500);
            } else {
                setMedicalMessage('Failed to save information.');
            }
        } catch (error) {
            setMedicalMessage('An error occurred.');
        } finally {
            setSavingMedical(false);
        }
    };

    useEffect(() => {
        if (patientData?._id) {
            fetchPatientReports(patientData._id);
        }
    }, [patientData?._id]);

    const fetchPatientReports = async (patientId: string) => {
        setLoadingReports(true);
        try {
            const response = await fetch(`http://localhost:8000/doctor/patient/${patientId}/reports`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setReports(data);
            }
        } catch (error) {
            console.error('Error fetching patient reports:', error);
        } finally {
            setLoadingReports(false);
        }
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

    useEffect(() => {
        if (initialPatient) {
            setPatientData(initialPatient);
        }
    }, [initialPatient]);

    const handleChatClick = () => {
        setActiveTab('chat');
    };

    const getConditionColor = () => {
        const conditionMap: Record<string, string> = {
            "Critical": isDarkMode ? "bg-red-900 text-red-300" : "bg-red-100 text-red-800",
            "Stable": isDarkMode ? "bg-green-900 text-green-300" : "bg-green-100 text-green-800",
            "Improving": isDarkMode ? "bg-blue-900 text-blue-300" : "bg-blue-100 text-blue-800",
            "Recovering": isDarkMode ? "bg-teal-900 text-teal-300" : "bg-teal-100 text-teal-800"
        };

        return patientData?.condition && conditionMap[patientData.condition] ?
            conditionMap[patientData.condition] :
            (isDarkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-800");
    };

    return (
        <div className={`min-h-screen pb-12 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
            <div className="max-w-7xl mx-auto px-6">
                <div className={`mt-6 rounded-xl shadow-lg overflow-hidden ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <div className={`py-10 px-8 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                            <div className="flex items-center mb-4 md:mb-0">
                                <div className={`flex items-center justify-center h-16 w-16 rounded-full ${isDarkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-800'} mr-4`}>
                                    <User className="h-8 w-8" />
                                </div>
                                <div>
                                    <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                                        {patientData?.name || 'Patient Details'}
                                    </h1>
                                    <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                        Patient ID: {patientData?._id.substring(0, 8)}...
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center">
                                <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getConditionColor()}`}>
                                    {patientData?.condition}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className={`flex border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`flex items-center py-4 px-6 font-medium transition-colors duration-200 ${activeTab === 'overview' ? (isDarkMode ? 'text-blue-400 border-b-2 border-blue-400' : 'text-blue-600 border-b-2 border-blue-600') : (isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-800')}`}
                        >
                            <BadgeInfo className="h-5 w-5 mr-2" />
                            Overview
                        </button>
                        <button
                            onClick={() => setActiveTab('medical')}
                            className={`flex items-center py-4 px-6 font-medium transition-colors duration-200 ${activeTab === 'medical' ? (isDarkMode ? 'text-blue-400 border-b-2 border-blue-400' : 'text-blue-600 border-b-2 border-blue-600') : (isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-800')}`}
                        >
                            <HeartPulse className="h-5 w-5 mr-2" />
                            Medical Info
                        </button>
                        <button
                            onClick={handleChatClick}
                            className={`flex items-center py-4 px-6 font-medium transition-colors duration-200 ${activeTab === 'chat' ? (isDarkMode ? 'text-blue-400 border-b-2 border-blue-400' : 'text-blue-600 border-b-2 border-blue-600') : (isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-800')}`}
                        >
                            <MessageSquare className="h-5 w-5 mr-2" />
                            Chat
                        </button>
                        <button
                            onClick={() => setActiveTab('reports')}
                            className={`flex items-center py-4 px-6 font-medium transition-colors duration-200 ${activeTab === 'reports' ? (isDarkMode ? 'text-blue-400 border-b-2 border-blue-400' : 'text-blue-600 border-b-2 border-blue-600') : (isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-800')}`}
                        >
                            <Upload className="h-5 w-5 mr-2" />
                            Reports
                        </button>
                    </div>
                </div>

                <div className="mt-6">
                    {activeTab === 'overview' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Personal Information */}
                            <div className={`col-span-1 rounded-xl shadow-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-6`}>
                                <h2 className={`text-xl font-semibold mb-6 flex items-center ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                                    <User className="h-5 w-5 mr-2" />
                                    Personal Information
                                </h2>
                                <div className="space-y-3">
                                    <div className={`rounded-lg p-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                        <p className={`text-xs font-medium uppercase tracking-wide ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Full Name</p>
                                        <p className={`font-medium mt-1 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{patientData?.name || '—'}</p>
                                    </div>
                                    <div className={`rounded-lg p-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                        <p className={`text-xs font-medium uppercase tracking-wide ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Gender</p>
                                        <p className={`font-medium mt-1 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{patientData?.gender || '—'}</p>
                                    </div>
                                    <div className={`rounded-lg p-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                        <p className={`text-xs font-medium uppercase tracking-wide ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Age</p>
                                        <p className={`font-medium mt-1 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{patientData?.age ? `${patientData.age} years` : '—'}</p>
                                    </div>
                                    <div className={`rounded-lg p-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                        <p className={`text-xs font-medium uppercase tracking-wide ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Date of Birth</p>
                                        <p className={`font-medium mt-1 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                            {patientData?.dob ? new Date(patientData.dob).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
                                        </p>
                                    </div>
                                    {patientData?.Email && (
                                        <div className={`rounded-lg p-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                            <p className={`text-xs font-medium uppercase tracking-wide ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Email</p>
                                            <p className={`font-medium mt-1 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{patientData.Email}</p>
                                        </div>
                                    )}
                                    <div className={`rounded-lg p-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                        <p className={`text-xs font-medium uppercase tracking-wide ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Patient ID</p>
                                        <p className={`font-medium mt-1 text-xs ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{patientData?._id}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Patient-Reported Info + Summary */}
                            <div className="col-span-1 md:col-span-2 space-y-6">
                                {/* Condition & Description */}
                                <div className={`rounded-xl shadow-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-6`}>
                                    <h2 className={`text-xl font-semibold mb-4 flex items-center ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                                        <Bookmark className="h-5 w-5 mr-2" />
                                        Patient Summary
                                    </h2>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className={`rounded-lg p-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                            <div className="flex items-center mb-2">
                                                <HeartPulse className={`h-4 w-4 mr-2 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                                                <p className={`text-xs font-medium uppercase tracking-wide ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Current Condition</p>
                                            </div>
                                            <p className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                                {patientData?.condition && patientData.condition !== 'Linked Profile' ? patientData.condition : <span className={isDarkMode ? 'text-gray-500' : 'text-gray-400'}>Not assessed yet</span>}
                                            </p>
                                        </div>
                                        <div className={`rounded-lg p-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                            <div className="flex items-center mb-2">
                                                <Shield className={`h-4 w-4 mr-2 ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`} />
                                                <p className={`text-xs font-medium uppercase tracking-wide ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Risk Factor</p>
                                            </div>
                                            <p className={`font-medium capitalize ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                                {patientData?.latest_risk_factor || <span className={isDarkMode ? 'text-gray-500' : 'text-gray-400'}>—</span>}
                                            </p>
                                        </div>
                                    </div>
                                    {(patientData?.description && patientData.description !== 'Patient linked via profile request.') && (
                                        <div className={`mt-4 rounded-lg p-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                            <p className={`text-xs font-medium uppercase tracking-wide mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Description</p>
                                            <p className={`whitespace-pre-line ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{patientData.description}</p>
                                        </div>
                                    )}
                                    {patientData?.symptoms && (
                                        <div className={`mt-4 rounded-lg p-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                            <p className={`text-xs font-medium uppercase tracking-wide mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Symptoms</p>
                                            <p className={`whitespace-pre-line ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{patientData.symptoms}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Patient-Reported Health Info */}
                                <div className={`rounded-xl shadow-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-6`}>
                                    <h2 className={`text-xl font-semibold mb-2 flex items-center ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                                        <FileText className="h-5 w-5 mr-2" />
                                        Patient-Reported Information
                                    </h2>
                                    <p className={`text-xs mb-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Filled by the patient from their profile</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className={`rounded-lg p-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                            <p className={`text-xs font-medium uppercase tracking-wide mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Allergies</p>
                                            <p className={`text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{patientData?.allergies || <span className={isDarkMode ? 'text-gray-500' : 'text-gray-400'}>None specified</span>}</p>
                                        </div>
                                        <div className={`rounded-lg p-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                            <p className={`text-xs font-medium uppercase tracking-wide mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Current Medications</p>
                                            <p className={`text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{patientData?.medications || <span className={isDarkMode ? 'text-gray-500' : 'text-gray-400'}>None specified</span>}</p>
                                        </div>
                                        <div className={`rounded-lg p-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} sm:col-span-2`}>
                                            <p className={`text-xs font-medium uppercase tracking-wide mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Personal Medical History</p>
                                            <p className={`text-sm whitespace-pre-line ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{patientData?.personalHistory || <span className={isDarkMode ? 'text-gray-500' : 'text-gray-400'}>Not provided</span>}</p>
                                        </div>
                                        <div className={`rounded-lg p-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} sm:col-span-2`}>
                                            <p className={`text-xs font-medium uppercase tracking-wide mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Family Medical History</p>
                                            <p className={`text-sm whitespace-pre-line ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{patientData?.familyHistory || <span className={isDarkMode ? 'text-gray-500' : 'text-gray-400'}>Not provided</span>}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'medical' && (
                        <div className="space-y-6">
                            {/* Edit Controls */}
                            <div className="flex justify-between items-center bg-transparent">
                                <div>
                                    {medicalMessage && (
                                        <div className={`px-4 py-2 rounded-lg text-sm font-medium ${medicalMessage.includes('success') ? (isDarkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700') : (isDarkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-700')}`}>
                                            {medicalMessage}
                                        </div>
                                    )}
                                </div>
                                {!isEditingMedical ? (
                                    <button
                                        onClick={startEditingMedical}
                                        className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium ${isDarkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'} transition-colors gap-2 shadow-sm`}
                                    >
                                        <Edit2 className="w-4 h-4" /> Edit Clinical Info
                                    </button>
                                ) : (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => { setIsEditingMedical(false); setMedicalMessage(''); }}
                                            disabled={savingMedical}
                                            className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'} transition-colors gap-2 disabled:opacity-50`}
                                        >
                                            <X className="w-4 h-4" /> Cancel
                                        </button>
                                        <button
                                            onClick={saveMedicalInfo}
                                            disabled={savingMedical}
                                            className="flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors gap-2 shadow-sm disabled:opacity-50"
                                        >
                                            <Save className="w-4 h-4" /> {savingMedical ? 'Saving...' : 'Save Changes'}
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Vital Signs */}
                            <div className={`rounded-xl shadow-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-6 transition-colors`}>
                                <h2 className={`text-xl font-semibold mb-2 flex items-center ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                                    <HeartPulse className="h-5 w-5 mr-2" />
                                    Vital Signs
                                </h2>
                                <p className={`text-xs mb-5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Recorded by the doctor during consultation</p>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                                    {[
                                        { id: 'temperature', label: 'Temperature (°C)', type: 'number' },
                                        { id: 'pulse', label: 'Pulse (bpm)', type: 'number' },
                                        { id: 'bloodPressure', label: 'Blood Pressure', type: 'text', placeholder: '120/80' },
                                        { id: 'height', label: 'Height (cm)', type: 'number' },
                                        { id: 'weight', label: 'Weight (kg)', type: 'number' },
                                    ].map((vital) => (
                                        <div key={vital.id} className={`rounded-lg p-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                            <p className={`text-xs font-medium uppercase tracking-wide mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{vital.label}</p>
                                            {isEditingMedical ? (
                                                vital.id === 'bloodPressure' ? (
                                                    <div className="flex items-center gap-1">
                                                        <input
                                                            type="text"
                                                            value={medicalForm.bloodPressure.split('/')[0] || ''}
                                                            onChange={(e) => {
                                                                const sys = e.target.value;
                                                                const dia = medicalForm.bloodPressure.split('/')[1] || '';
                                                                handleMedicalChange('bloodPressure', `${sys}/${dia}`);
                                                            }}
                                                            className={`w-full p-2 text-center rounded border focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                                                            placeholder="120"
                                                        />
                                                        <span className={`font-bold ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>/</span>
                                                        <input
                                                            type="text"
                                                            value={medicalForm.bloodPressure.split('/')[1] || ''}
                                                            onChange={(e) => {
                                                                const sys = medicalForm.bloodPressure.split('/')[0] || '';
                                                                const dia = e.target.value;
                                                                handleMedicalChange('bloodPressure', `${sys}/${dia}`);
                                                            }}
                                                            className={`w-full p-2 text-center rounded border focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                                                            placeholder="80"
                                                        />
                                                    </div>
                                                ) : (
                                                    <input
                                                        type={vital.type}
                                                        value={medicalForm[vital.id as keyof typeof medicalForm]}
                                                        onChange={(e) => handleMedicalChange(vital.id, e.target.value)}
                                                        className={`w-full p-2 text-center rounded border focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                                                        placeholder={vital.placeholder || "—"}
                                                    />
                                                )
                                            ) : (
                                                <p className={`text-lg font-bold text-center mt-1 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                                                    {vital.id === 'temperature' ? (patientData?.temperature ? `${patientData.temperature}°C` : '—') :
                                                        vital.id === 'pulse' ? (patientData?.pulse ? `${patientData.pulse} bpm` : '—') :
                                                            vital.id === 'bloodPressure' ? (patientData?.bloodPressure || '—') :
                                                                vital.id === 'height' ? (patientData?.height ? `${patientData.height} cm` : '—') :
                                                                    vital.id === 'weight' ? (patientData?.weight ? `${patientData.weight} kg` : '—') : '—'}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Condition & Clinical Notes */}
                            <div className={`rounded-xl shadow-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-6 transition-colors`}>
                                <h2 className={`text-xl font-semibold mb-5 flex items-center ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                                    <Shield className="h-5 w-5 mr-2" />
                                    Clinical Assessment
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className={`rounded-lg p-5 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                        <p className={`text-xs font-medium uppercase tracking-wide mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Condition Status</p>
                                        {isEditingMedical ? (
                                            <input
                                                type="text"
                                                value={medicalForm.condition}
                                                onChange={(e) => handleMedicalChange('condition', e.target.value)}
                                                placeholder="e.g. Stable, Critical..."
                                                className={`w-full p-2 rounded border focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                                            />
                                        ) : (
                                            <div className={`py-2 px-4 rounded-md inline-block ${getConditionColor()}`}>
                                                <span className="font-semibold">
                                                    {patientData?.condition && patientData.condition !== 'Linked Profile' ? patientData.condition : 'Not assessed yet'}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    {!isEditingMedical && (
                                        <div className={`rounded-lg p-5 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                            <p className={`text-xs font-medium uppercase tracking-wide mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Risk Level & Score</p>
                                            <p className={`font-semibold capitalize ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                                {patientData?.latest_risk_factor || '—'}
                                                {patientData?.score ? ` (Score: ${patientData.score})` : ''}
                                            </p>
                                        </div>
                                    )}
                                    <div className={`rounded-lg p-5 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} ${isEditingMedical ? 'md:col-span-1' : 'md:col-span-2'}`}>
                                        <p className={`text-xs font-medium uppercase tracking-wide mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Symptoms</p>
                                        {isEditingMedical ? (
                                            <textarea
                                                rows={4}
                                                value={medicalForm.symptoms}
                                                onChange={(e) => handleMedicalChange('symptoms', e.target.value)}
                                                placeholder="Enter recorded symptoms..."
                                                className={`w-full p-2 rounded border focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                                            />
                                        ) : (
                                            <p className={`whitespace-pre-line ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                                {patientData?.symptoms || <span className={isDarkMode ? 'text-gray-500' : 'text-gray-400'}>None recorded</span>}
                                            </p>
                                        )}
                                    </div>
                                    <div className={`rounded-lg p-5 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} md:col-span-2`}>
                                        <p className={`text-xs font-medium uppercase tracking-wide mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Medical Description</p>
                                        {isEditingMedical ? (
                                            <textarea
                                                rows={5}
                                                value={medicalForm.description}
                                                onChange={(e) => handleMedicalChange('description', e.target.value)}
                                                placeholder="Enter full medical description and notes..."
                                                className={`w-full p-3 rounded border focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                                            />
                                        ) : (
                                            <div className={`mt-1 p-4 rounded-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                                                <p className={`whitespace-pre-line leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                                    {patientData?.description && patientData.description !== 'Patient linked via profile request.'
                                                        ? patientData.description
                                                        : <span className={isDarkMode ? 'text-gray-500' : 'text-gray-400'}>No description added yet</span>}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                    {(isEditingMedical || patientData?.remarks) && (
                                        <div className={`rounded-lg p-5 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} md:col-span-2`}>
                                            <p className={`text-xs font-medium uppercase tracking-wide mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Doctor's Remarks</p>
                                            {isEditingMedical ? (
                                                <textarea
                                                    rows={3}
                                                    value={medicalForm.remarks}
                                                    onChange={(e) => handleMedicalChange('remarks', e.target.value)}
                                                    placeholder="Add any specific remarks or follow-up instructions..."
                                                    className={`w-full p-3 rounded border focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                                                />
                                            ) : (
                                                <p className={`whitespace-pre-line ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{patientData?.remarks}</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'reports' && (
                        <div className={`rounded-xl shadow-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-6`}>
                            <h2 className={`text-xl font-semibold mb-6 flex items-center ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                                <Upload className="h-5 w-5 mr-2" />
                                Patient Reports
                            </h2>
                            {loadingReports ? (
                                <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Loading reports...</p>
                            ) : reports.length === 0 ? (
                                <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>No reports uploaded by this patient yet.</p>
                            ) : (
                                <div className="space-y-3">
                                    {reports.map((report) => (
                                        <div key={report._id} className={`rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'} p-4 flex items-center justify-between`}>
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg flex items-center justify-center`}>
                                                    {report.file_type?.startsWith('image/') ? <Image className="w-5 h-5 text-purple-500" /> : <FileText className="w-5 h-5 text-blue-500" />}
                                                </div>
                                                <div>
                                                    <p className={`text-sm font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{report.report_name}</p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className={`text-xs ${isDarkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-600'} px-2 py-0.5 rounded-full`}>{report.report_type}</span>
                                                        <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{new Date(report.uploaded_at).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <button onClick={() => handleViewReport(report._id)} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors" title="View/Download">
                                                <Download className="w-5 h-5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                    {activeTab === 'chat' && (
                        <Chat isDarkMode={isDarkMode} patientId={patientData?._id || ''} />
                    )}
                </div>
            </div>
        </div>
    );
};

export default Patient;