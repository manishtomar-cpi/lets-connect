'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const Navbar = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      if (typeof window !== 'undefined') {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          setIsLoggedIn(true);
        } else {
          setIsLoggedIn(false);
        }
      }
    };
    checkAuth();
  }, []);

  const handleLogout = async () => {
    if (typeof window !== 'undefined') {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      if (response.ok) {
        setIsLoggedIn(false);
        router.push('/');  // Redirect to home after logout
        router.refresh();  // Ensure that the state is fully updated
      }
    }
  };

  return (
    <nav className="bg-blue-600 p-4 sticky top-0 z-50">
      <div className="container mx-auto flex flex-wrap justify-between items-center">
        <div className="w-full flex justify-between lg:w-auto">
          <Link href="/" className="text-white text-2xl font-bold">
            Lets-Connect
          </Link>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden text-white focus:outline-none"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16m-7 6h7"
              />
            </svg>
          </button>
        </div>
        <div
          className={`w-full lg:flex flex-grow lg:items-center lg:w-auto ${isOpen ? 'block' : 'hidden'}`}
        >
          <div className="flex flex-row lg:flex-row lg:ml-auto lg:space-x-4 mt-2 lg:mt-0 lg:items-center">
            {isLoggedIn ? (
              <>
                <Link href="/" className="text-white mr-2">
                  Home
                </Link>
                <Link href="/dashboard" className="text-white mr-2">
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-white lg:ml-4 mt-0 lg:mt-0"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/" className="text-white mr-2">
                  Home
                </Link>
                <Link href="/login" className="text-white lg:ml-4 mt-2 mr-3 lg:mt-0">
                  Login
                </Link>
                <Link href="/signup" className="text-white lg:ml-4 mt-2 lg:mt-0">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
