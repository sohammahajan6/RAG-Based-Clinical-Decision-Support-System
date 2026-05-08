import React, { useState, useEffect } from 'react';
import Helmet from "./Helemt/Helmet";
import Header from './Header';
import heroimg1 from "./assets/header_img.png";
import { HeartPulse, Shield, Brain, Users, ArrowRight } from 'lucide-react';

const Home: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
    }, []);

    const features = [
        {
            icon: Brain,
            title: 'AI-Powered Diagnosis',
            description: 'Get accurate clinical insights powered by medical research and AI technology.',
            color: 'blue',
        },
        {
            icon: Shield,
            title: 'Risk Assessment',
            description: 'Automatic risk factor analysis with real-time alerts for critical conditions.',
            color: 'teal',
        },
        {
            icon: Users,
            title: 'Patient Management',
            description: 'Manage patient records, track conditions, and maintain treatment history.',
            color: 'indigo',
        },
    ];

    const colorMap: Record<string, { bg: string; icon: string; border: string }> = {
        blue: { bg: 'bg-blue-50', icon: 'text-blue-600', border: 'border-blue-100' },
        teal: { bg: 'bg-teal-50', icon: 'text-teal-600', border: 'border-teal-100' },
        indigo: { bg: 'bg-indigo-50', icon: 'text-indigo-600', border: 'border-indigo-100' },
    };

    return (
        <>
            <Header isLoggedIn={false} onLogout={() => { }} />
            <Helmet title={"Home"}>
                <section className="min-h-screen bg-white pt-20">
                    {/* Hero Section */}
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
                        <div className="flex flex-col md:flex-row items-center gap-12">
                            {/* Left Column */}
                            <div className={`w-full md:w-1/2 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
                                <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-sm font-medium px-3 py-1.5 rounded-full mb-6">
                                    <HeartPulse className="w-4 h-4" />
                                    Clinical Decision Support
                                </div>

                                <h2 className="text-3xl sm:text-4xl font-bold text-slate-800 leading-tight mb-3">
                                    Smarter decisions for
                                </h2>
                                <h2 className="text-3xl sm:text-4xl font-bold text-blue-600 leading-tight mb-6">
                                    better patient care
                                </h2>

                                <p className="text-base text-slate-600 leading-relaxed mb-8 max-w-lg">
                                    AIsculapius helps doctors make informed clinical decisions using AI-powered
                                    analysis of medical research. Patients can track their health records
                                    and stay informed about their care.
                                </p>

                                <div className="flex flex-wrap gap-3">
                                    <a
                                        href="/register"
                                        className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors text-sm"
                                    >
                                        Get Started
                                        <ArrowRight className="w-4 h-4" />
                                    </a>
                                    <a
                                        href="/login"
                                        className="inline-flex items-center gap-2 px-6 py-3 bg-white text-slate-700 font-medium rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors text-sm"
                                    >
                                        Sign In
                                    </a>
                                </div>
                            </div>

                            {/* Right Column - Image */}
                            <div className={`w-full md:w-1/2 transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
                                <div className="relative">
                                    <div className="absolute -inset-4 bg-blue-100 rounded-2xl -z-10"></div>
                                    <img
                                        src={heroimg1}
                                        alt="AI Medical Assistant"
                                        className="relative z-10 w-full h-auto rounded-xl"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Features Section */}
                    <div className="bg-slate-50 border-t border-slate-100">
                        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
                            <div className="text-center mb-10">
                                <h3 className="text-xl font-bold text-slate-800 mb-2">How it works</h3>
                                <p className="text-slate-500 text-sm">For doctors and patients alike</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                {features.map((feature, index) => {
                                    const colors = colorMap[feature.color];
                                    return (
                                        <div
                                            key={index}
                                            className={`bg-white p-6 rounded-xl border ${colors.border} transition-all duration-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                                                }`}
                                            style={{ transitionDelay: `${index * 150 + 400}ms` }}
                                        >
                                            <div className={`w-10 h-10 ${colors.bg} rounded-lg flex items-center justify-center mb-4`}>
                                                <feature.icon className={`w-5 h-5 ${colors.icon}`} />
                                            </div>
                                            <h3 className="text-base font-semibold text-slate-800 mb-2">
                                                {feature.title}
                                            </h3>
                                            <p className="text-sm text-slate-500 leading-relaxed">
                                                {feature.description}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* For Patients / For Doctors Section */}
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-teal-50 border border-teal-100 rounded-xl p-6">
                                <h3 className="text-lg font-semibold text-teal-800 mb-2">For Patients</h3>
                                <ul className="space-y-2 text-sm text-teal-700">
                                    <li className="flex items-start gap-2">
                                        <span className="mt-1 w-1.5 h-1.5 bg-teal-500 rounded-full flex-shrink-0"></span>
                                        View your medical records in one place
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="mt-1 w-1.5 h-1.5 bg-teal-500 rounded-full flex-shrink-0"></span>
                                        Track your risk assessments and health status
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="mt-1 w-1.5 h-1.5 bg-teal-500 rounded-full flex-shrink-0"></span>
                                        Review consultation history from your doctor
                                    </li>
                                </ul>
                                <a
                                    href="/register"
                                    className="inline-flex items-center gap-1 mt-4 text-sm font-medium text-teal-700 hover:text-teal-800"
                                >
                                    Sign up as Patient <ArrowRight className="w-3.5 h-3.5" />
                                </a>
                            </div>

                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-6">
                                <h3 className="text-lg font-semibold text-blue-800 mb-2">For Doctors</h3>
                                <ul className="space-y-2 text-sm text-blue-700">
                                    <li className="flex items-start gap-2">
                                        <span className="mt-1 w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0"></span>
                                        AI-powered clinical decision support
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="mt-1 w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0"></span>
                                        Manage patient records and treatment plans
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="mt-1 w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0"></span>
                                        Get alerts for critical patient conditions
                                    </li>
                                </ul>
                                <a
                                    href="/register"
                                    className="inline-flex items-center gap-1 mt-4 text-sm font-medium text-blue-700 hover:text-blue-800"
                                >
                                    Sign up as Doctor <ArrowRight className="w-3.5 h-3.5" />
                                </a>
                            </div>
                        </div>
                    </div>
                </section>
            </Helmet>
        </>
    );
};

export default Home;