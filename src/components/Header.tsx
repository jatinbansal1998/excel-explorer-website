import React from 'react';

export function Header() {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900">
              Excel Explorer
            </h1>
            <div className="hidden sm:block text-sm text-gray-500">
              Upload, explore, and visualize your Excel data
            </div>
          </div>
          
          <nav className="flex items-center space-x-6">
            <a 
              href="#" 
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Help
            </a>
            <a 
              href="#" 
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              About
            </a>
          </nav>
        </div>
      </div>
    </header>
  );
}