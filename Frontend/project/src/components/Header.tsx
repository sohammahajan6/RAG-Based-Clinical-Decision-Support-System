import React, { useRef, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import userIcon from './assets/account-circle-line.png';
import { toast } from 'react-toastify';

interface HeaderProps {
    isLoggedIn: boolean;
    onLogout: () => void;
}

const nav__links = [
    { path: '/', display: 'Home' },
    { path: '/chatbot', display: 'ChatBot' },
];

const Header: React.FC<HeaderProps> = ({ isLoggedIn, onLogout }) => {
    const headerRef = useRef<HTMLDivElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const profileActionRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    const stickyHeaderFunc = () => {
        const handleScroll = () => {
            if (
                document.body.scrollTop > 80 ||
                document.documentElement.scrollTop > 80
            ) {
                headerRef.current?.classList.add('sticky', 'top-0', 'shadow-md');
            } else {
                headerRef.current?.classList.remove('sticky', 'top-0', 'shadow-md');
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    };

    const logout = () => {
        onLogout();
        toast.success('Logged out');
        navigate('/');
    };

    useEffect(() => {
        stickyHeaderFunc();
    }, []);

    const menuToggle = () => menuRef.current?.classList.toggle('hidden');
    const toggleProfileActions = () =>
        profileActionRef.current?.classList.toggle('hidden');

    const hideProfileActions = () => {
        profileActionRef.current?.classList.add('hidden');
    };

    return (
        <header ref={headerRef} className="bg-white w-full fixed top-0 z-50 h-16">
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-center py-4">
                    <div className="logo">
                        <Link to="/" className="text-2xl font-bold text-blue-600">
                            Eternals
                        </Link>
                    </div>
                    <div className="navigation hidden md:block" ref={menuRef}>
                        <ul className="flex space-x-6">
                            {nav__links.map((item, index) => (
                                <li key={index}>
                                    <NavLink
                                        to={item.path}
                                        className={({ isActive }) =>
                                            isActive
                                                ? 'text-blue-600 font-semibold'
                                                : 'text-gray-700 hover:text-blue-600'
                                        }
                                    >
                                        {item.display}
                                    </NavLink>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="nav__icons flex items-center space-x-4">
                        <div className="profile relative">
                            <motion.img
                                whileTap={{ scale: 1.2 }}
                                src={userIcon}
                                alt=""
                                className="w-8 h-8 cursor-pointer"
                                onClick={toggleProfileActions}
                            />
                            <div
                                ref={profileActionRef}
                                className="profile__actions absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg hidden"
                            >
                                {isLoggedIn ? (
                                    <div className="flex flex-col p-2">
                                        <button
                                            onClick={logout}
                                            className="text-gray-700 hover:bg-gray-100 p-2 rounded-lg"
                                        >
                                            Logout
                                        </button>
                                        <Link
                                            to="/login"
                                            className="text-gray-700 hover:bg-gray-100 p-2 rounded-lg"
                                            onClick={hideProfileActions}
                                        >
                                            My Bot
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="flex flex-col p-2">
                                        <Link
                                            to="/register"
                                            className="text-gray-700 hover:bg-gray-100 p-2 rounded-lg"
                                            onClick={hideProfileActions}
                                        >
                                            Signup
                                        </Link>
                                        <Link
                                            to="/login"
                                            className="text-gray-700 hover:bg-gray-100 p-2 rounded-lg"
                                            onClick={hideProfileActions}
                                        >
                                            Login
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="mobile__menu md:hidden">
                            <button onClick={menuToggle} className="text-gray-700">
                                <i className="ri-menu-line text-2xl"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;