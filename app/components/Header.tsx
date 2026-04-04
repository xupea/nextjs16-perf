import React, { useState } from 'react';
import { User } from '../context/UserContext';

interface HeaderProps {
  user: User | null;
  onLogin: () => void;
  onRegister: () => void;
  onLogout: () => void;
  onCurrencyChange: (currency: string) => void;
}

const currencies = [
  { code: 'USD', symbol: '$' },
  { code: 'EUR', symbol: '€' },
  { code: 'GBP', symbol: '£' },
  { code: 'JPY', symbol: '¥' },
];

export default function Header({
  user,
  onLogin,
  onRegister,
  onLogout,
  onCurrencyChange,
}: HeaderProps) {
  const [isBalanceDropdownOpen, setIsBalanceDropdownOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-black text-white border-b border-gray-800">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center">
          <div className="text-2xl font-bold">STAKE</div>
        </div>

        {/* Navigation */}
        <nav>
          {!user ? (
            /* Not logged in state */
            <div className="flex items-center gap-4">
              <button
                onClick={onRegister}
                className="px-4 py-2 bg-transparent border border-white rounded hover:bg-white hover:text-black transition-colors"
              >
                Register
              </button>
              <button
                onClick={onLogin}
                className="px-4 py-2 bg-white text-black rounded hover:bg-gray-200 transition-colors"
              >
                Login
              </button>
            </div>
          ) : (
            /* Logged in state */
            <div className="flex items-center gap-6">
              {/* Balance Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsBalanceDropdownOpen(!isBalanceDropdownOpen)}
                  className="flex items-center gap-2 px-4 py-2 hover:bg-gray-800 rounded transition-colors"
                >
                  <span>
                    {currencies.find(c => c.code === user.currency)?.symbol}
                    {user.balance.toFixed(2)}
                  </span>
                  <span className="text-xs">▼</span>
                </button>
                {isBalanceDropdownOpen && (
                  <div className="absolute top-full right-0 mt-2 w-48 bg-gray-900 border border-gray-800 rounded shadow-lg py-2">
                    {currencies.map(currency => (
                      <button
                        key={currency.code}
                        onClick={() => {
                          onCurrencyChange(currency.code);
                          setIsBalanceDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 hover:bg-gray-800 transition-colors ${user.currency === currency.code ? 'bg-gray-800 font-medium' : ''}`}
                      >
                        {currency.code} ({currency.symbol})
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Wallet Button */}
              <button className="p-2 hover:bg-gray-800 rounded transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
              </button>

              {/* Search Button */}
              <button className="p-2 hover:bg-gray-800 rounded transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
              </button>

              {/* Notifications Button */}
              <button className="p-2 hover:bg-gray-800 rounded transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              </button>

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 px-4 py-2 hover:bg-gray-800 rounded transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span>{user.name}</span>
                  <span className="text-xs">▼</span>
                </button>
                {isUserMenuOpen && (
                  <div className="absolute top-full right-0 mt-2 w-48 bg-gray-900 border border-gray-800 rounded shadow-lg py-2">
                    <button className="w-full text-left px-4 py-2 hover:bg-gray-800 transition-colors">
                      Profile
                    </button>
                    <button className="w-full text-left px-4 py-2 hover:bg-gray-800 transition-colors">
                      Settings
                    </button>
                    <button
                      onClick={onLogout}
                      className="w-full text-left px-4 py-2 hover:bg-gray-800 transition-colors text-red-400"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
