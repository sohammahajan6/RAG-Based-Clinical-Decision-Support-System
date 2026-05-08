import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  MessageSquare,
  LogOut,
  Activity,
  Settings,
  Bell,
  Sun,
  Moon,
  BookOpen,
  User
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
        console.log(data); // Log the fetched data

        // Map _id to id
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

  return (
    <div className={`flex h-screen ${isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-100'}`}>
      {/* Sidebar */}
      <div className={`w-72 ${isDarkMode ? 'bg-gray-800 text-gray-100 border-gray-700' : 'bg-white text-gray-800 border-r'}`}>
        {/* Header */}
        <div className={`p-6 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} flex justify-between items-center`}>
          <div>
            <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>AIsculapius</h1>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
              Welcome, Dr. {userData?.first_name} {userData?.last_name}
            </p>
          </div>

          {/* Notifications and Theme Toggle */}
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleDarkMode}
              className={`p-2 rounded-full hover:bg-opacity-20 ${isDarkMode
                ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
            >
              {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <button
              className={`p-2 rounded-full ${isDarkMode
                ? 'text-blue-400 hover:bg-gray-700'
                : 'text-gray-600 hover:bg-gray-200'
                }`}
            >
              <Bell className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {[
            {
              name: 'patients',
              icon: Users,
              label: 'Patients'
            },
            {
              name: 'add-patient',
              icon: UserPlus,
              label: 'Add Patient'
            },
            {
              name: 'research',  // Add this new section
              icon: BookOpen,
              label: 'Med-Bot'
            },
            ...(selectedPatient
              ? [
                {
                  name: 'patient-details', // New option for patient details
                  icon: User,
                  label: 'Patient Details'
                }
              ]
              : [])
          ].map((tab) => (
            <button
              key={tab.name}
              onClick={() => setActiveTab(tab.name)}
              className={`
                flex items-center w-full p-3 rounded-lg transition-all duration-300
                ${activeTab === tab.name
                  ? (isDarkMode
                    ? 'bg-blue-900 text-blue-300'
                    : 'bg-blue-100 text-blue-600')
                  : (isDarkMode
                    ? 'hover:bg-gray-700 text-gray-300 hover:text-white'
                    : 'hover:bg-gray-200 text-gray-600')}
              `}
            >
              <tab.icon className="h-5 w-5 mr-3" />
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className={`p-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <button
            onClick={onLogout}
            className={`
              flex items-center w-full p-3 rounded-lg transition-all duration-300
              ${isDarkMode
                ? 'hover:bg-gray-700 text-gray-300 hover:text-white'
                : 'hover:bg-gray-200 text-gray-600'}
            `}
          >
            <LogOut className="h-5 w-5 mr-3" />
            Logout
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className={`flex-1 overflow-auto p-6 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
        <div className={`
          rounded-xl shadow-lg overflow-hidden
          ${isDarkMode
            ? 'bg-gray-800 border-gray-700'
            : 'bg-white border border-gray-200'}
        `}>
          {activeTab === 'patients' && (
            <PatientList
              patients={patients}
              onPatientSelect={handlePatientSelect}
              onPatientRemove={handlePatientRemove}
              isDarkMode={isDarkMode}
            />
          )}

          {activeTab === 'add-patient' && (
            <PatientForm
              token={token}
              onPatientCreated={handlePatientCreated}
              isDarkMode={isDarkMode}
            />
          )}

          {activeTab === 'research' && (
            <ChatInterface
              token={token}
              isDarkMode={isDarkMode}
              isResearchMode={true} // Add this prop to ChatInterface
            />
          )}

          {activeTab === 'patient-details' && selectedPatient && (
            <Patient
              token={token}
              isDarkMode={isDarkMode}
              patient={selectedPatient}
              onChatClick={() => { }} // Remove or modify this prop if not needed
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Dash;