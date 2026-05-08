import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  LogOut,
  Bell,
  BookOpen,
  User,
  HeartPulse,
  Menu,
  X,
} from 'lucide-react';
import PatientList from './PatientList';
import PatientForm from './PatientForm';
import ChatInterface from './ChatInterface';
import Patient from './Patient';

interface UserData {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string;
}

interface DashboardProps {
  token: string;
  userData: UserData | null;
  onLogout: () => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const Dash: React.FC<DashboardProps> = ({ token, userData, onLogout, isDarkMode, toggleDarkMode }) => {
  const [activeTab, setActiveTab] = useState('patients');
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientData | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const response = await fetch('http://localhost:8000/patients', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const mappedData = data.map((patient: any) => ({
          ...patient,
          id: patient._id,
        }));
        setPatients(mappedData);
      } else {
        console.error('Failed to fetch patients');
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  };

  const handlePatientCreated = () => {
    fetchPatients();
    setActiveTab('patients');
  };

  const handlePatientSelect = (patient: PatientData) => {
    setSelectedPatient(patient);
    setActiveTab('patient-details');
  };

  const handlePatientDetails = (patient: any) => {
    setSelectedPatient(patient);
    setActiveTab('patient-details');
  };

  const handlePatientRemove = async (patientId: string) => {
    try {
      const res = await fetch(`http://localhost:8000/patients/${patientId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        fetchPatients(); // refresh list
      } else {
        console.error("Failed to delete patient");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const navItems = [
    { name: 'patients', icon: Users, label: 'Patients' },
    { name: 'add-patient', icon: UserPlus, label: 'Add Patient' },
    { name: 'research', icon: BookOpen, label: 'Med-Bot' },
    ...(selectedPatient
      ? [{ name: 'patient-details', icon: User, label: 'Patient Details' }]
      : []),
  ];

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-30
        w-64 bg-white border-r border-slate-200
        transform transition-transform duration-200 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Sidebar Header */}
        <div className="p-5 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <HeartPulse className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-800">AIsculapius</h1>
              </div>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 text-slate-400">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-semibold">
              {userData?.first_name?.charAt(0)}{userData?.last_name?.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700">
                Dr. {userData?.first_name} {userData?.last_name}
              </p>
              <p className="text-xs text-slate-400">Doctor</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-3 flex-1">
          <div className="space-y-1">
            {navItems.map((tab) => (
              <button
                key={tab.name}
                onClick={() => {
                  setActiveTab(tab.name);
                  setSidebarOpen(false);
                }}
                className={`
                  flex items-center w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                  ${activeTab === tab.name
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                  }
                `}
              >
                <tab.icon className="h-5 w-5 mr-3 flex-shrink-0" />
                {tab.label}
              </button>
            ))}
          </div>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-100">
          <button
            onClick={onLogout}
            className="flex items-center w-full px-3 py-2.5 rounded-lg text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut className="h-5 w-5 mr-3" />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="bg-white border-b border-slate-200 px-4 lg:px-6 h-14 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-base font-semibold text-slate-800">
              {activeTab === 'patients' && 'Patients'}
              {activeTab === 'add-patient' && 'Add Patient'}
              {activeTab === 'research' && 'Med-Bot'}
              {activeTab === 'patient-details' && 'Patient Details'}
            </h2>
          </div>
          <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
            <Bell className="h-5 w-5" />
          </button>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {activeTab === 'patients' && (
              <PatientList
                patients={patients}
                onPatientSelect={handlePatientSelect}
                onPatientRemove={handlePatientRemove}
                isDarkMode={false}
              />
            )}

            {activeTab === 'add-patient' && (
              <PatientForm
                token={token}
                onPatientCreated={handlePatientCreated}
                isDarkMode={false}
              />
            )}

            {activeTab === 'research' && (
              <ChatInterface
                token={token}
                isDarkMode={false}
                isResearchMode={true}
              />
            )}

            {activeTab === 'patient-details' && selectedPatient && (
              <Patient
                token={token}
                isDarkMode={false}
                patient={selectedPatient}
                onChatClick={() => { }}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dash;