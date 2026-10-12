import React, { useState, useEffect } from 'react';
import { CryptoVault, DecryptedVaultPayload } from '../services/cryptoVault';
import { Lock, Unlock, ShieldCheck, KeyRound, Download, Upload, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { TRANSLATIONS } from '../i18n/translations';
import { LanguageCode } from '../types/market';

interface VaultAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUnlockSuccess: (data: DecryptedVaultPayload) => void;
  language: LanguageCode;
  isDark?: boolean;
}

export const VaultAuthModal: React.FC<VaultAuthModalProps> = ({
  isOpen,
  onClose,
  onUnlockSuccess,
  language,
  isDark = true,
}) => {
  const t = TRANSLATIONS[language];
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [backupJSON, setBackupJSON] = useState('');

  useEffect(() => {
    if (isOpen) {
      CryptoVault.isVaultInitialized().then((init) => {
        setIsInitialized(init);
        setErrorMsg('');
        setSuccessMsg('');
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setIsLoading(true);
    setErrorMsg('');
    try {
      const data = await CryptoVault.unlockVault(password);
      setSuccessMsg('Vault unlocked successfully! Decrypted private watchlists & alerts.');
      setTimeout(() => {
        onUnlockSuccess(data);
        onClose();
      }, 500);
    } catch (err: any) {
      setErrorMsg(t.incorrectPassword || 'Invalid master password or decryption key.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 4) {
      setErrorMsg('Password must be at least 4 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }
    setIsLoading(true);
    setErrorMsg('');
    try {
      const data = await CryptoVault.setupNewVault(password);
      setSuccessMsg('Encrypted vault initialized with AES-256-GCM. Ready for monitoring.');
      setIsInitialized(true);
      setTimeout(() => {
        onUnlockSuccess(data);
        onClose();
      }, 600);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error setting up vault.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportBackup = async () => {
    try {
      const json = await CryptoVault.exportEncryptedVaultJSON();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `p0$u_tERMINAL_Vault_Backup_${Date.now()}.bpvault.json`;
      a.click();
      URL.revokeObjectURL(url);
      setSuccessMsg('Encrypted backup exported. You can restore this file on any machine.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Export error.');
    }
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        if (!password) {
          setErrorMsg('Enter master password above to decrypt the imported vault.');
          return;
        }
        const data = await CryptoVault.importEncryptedVaultJSON(content, password);
        setSuccessMsg('Encrypted vault imported and restored successfully!');
        setIsInitialized(true);
        setTimeout(() => {
          onUnlockSuccess(data);
          onClose();
        }, 600);
      } catch (err: any) {
        setErrorMsg('Failed to decrypt imported file. Please verify password.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl relative ${
          isDark
            ? 'bg-slate-900 border-slate-800 text-slate-100'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Security Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-800/80 text-cyan-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold">
              {isInitialized ? t.unlockVault : t.setupVault}
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              WebCrypto AES-256-GCM · PBKDF2 (100k) · Zero-Cloud
            </span>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 flex items-center gap-2 p-3 text-xs rounded-lg bg-rose-950/60 border border-rose-800/60 text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 flex items-center gap-2 p-3 text-xs rounded-lg bg-emerald-950/60 border border-emerald-800/60 text-emerald-300">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {isInitialized ? (
          /* Unlock Form */
          <form onSubmit={handleUnlock} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                {t.masterPasswordLabel}
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter vault password or PIN"
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg bg-slate-950 border border-slate-800 focus:outline-none focus:border-cyan-500 font-mono"
                  autoFocus
                />
                <KeyRound className="absolute right-3 top-3 w-4 h-4 text-slate-500" />
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {t.enterPasswordOrPin}
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="submit"
                disabled={isLoading || !password}
                className="w-full py-2.5 px-4 text-sm font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Unlock className="w-4 h-4" />
                {isLoading ? 'Decrypting...' : t.unlockVault}
              </button>
            </div>

            {/* Backup actions */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={handleExportBackup}
                className="text-slate-400 hover:text-cyan-400 transition-colors flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                Export Encrypted Vault
              </button>
              <label className="text-slate-400 hover:text-cyan-400 transition-colors flex items-center gap-1.5 cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                Import Backup
                <input
                  type="file"
                  accept=".json,.bpvault.json"
                  onChange={handleImportBackup}
                  className="hidden"
                />
              </label>
            </div>
          </form>
        ) : (
          /* Initial Setup Form */
          <form onSubmit={handleSetup} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Set Master Password / PIN
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Choose a master passkey (e.g. 6-digit PIN)"
                className="w-full px-3.5 py-2.5 text-sm rounded-lg bg-slate-950 border border-slate-800 focus:outline-none focus:border-cyan-500 font-mono"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                {t.confirmPassword}
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter master password"
                className="w-full px-3.5 py-2.5 text-sm rounded-lg bg-slate-950 border border-slate-800 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs text-slate-400 space-y-1">
              <p className="font-semibold text-slate-300">Zero-Config GitHub Ready:</p>
              <p>
                All data is encrypted in-memory and stored locally in browser IndexedDB. No external servers or API keys are required.
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading || !password || !confirmPassword}
              className="w-full py-2.5 px-4 text-sm font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" />
              {isLoading ? 'Encrypting...' : t.setupVault}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
