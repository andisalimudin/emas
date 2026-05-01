'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { fetchAPI } from '@/lib/api';

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>({
    heroTitle: '',
    heroSubtitle: '',
    contactEmail: '',
    maintenanceMode: 'false',
    TELEGRAM_ENABLED: 'true',
    TELEGRAM_BOT_TOKEN: '',
    TELEGRAM_CHAT_ID: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [telegramTestText, setTelegramTestText] = useState('Ujian notifikasi Telegram');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const data = await fetchAPI('/settings', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const formattedSettings: any = {};
      data.forEach((item: any) => {
        formattedSettings[item.key] = item.value;
      });
      setSettings((prev: any) => ({ ...prev, ...formattedSettings }));
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const telegramKeys = new Set(['TELEGRAM_ENABLED', 'TELEGRAM_BOT_TOKEN', 'TELEGRAM_CHAT_ID']);

      await Promise.all(
        Object.entries(settings).map(([key, value]) =>
          fetchAPI(`/settings/${key}`, {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              value,
              description: telegramKeys.has(key) ? 'Telegram' : 'Landing Page Setting',
            }),
          })
        )
      );

      setSuccess('Settings updated successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  const handleTelegramTest = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('token');
      const res: any = await fetchAPI('/telegram/test', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text: telegramTestText }),
      });
      if (res?.skipped) {
        setError('Telegram belum dikonfigurasi. Sila isi Bot Token dan Chat ID.');
      } else {
        setSuccess('Ujian Telegram berjaya dihantar!');
      }
    } catch (err: any) {
      setError(err.message || 'Gagal hantar ujian Telegram');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-white">Tetapan Sistem</h1>

      <form onSubmit={handleSubmit} className="bg-zinc-900 border border-white/10 rounded-xl p-6 space-y-6">
        {success && (
          <div className="bg-green-500/10 border border-green-500/20 text-green-500 p-3 rounded-lg text-sm">
            {success}
          </div>
        )}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <h2 className="text-lg font-medium text-gold-500">Kandungan Halaman Pendaratan</h2>
          
          <Input
            label="Tajuk Utama"
            name="heroTitle"
            value={settings.heroTitle}
            onChange={handleChange}
            placeholder="cth. Pelaburan Emas Premium"
          />
          
          <Input
            label="Subtajuk Utama"
            name="heroSubtitle"
            value={settings.heroSubtitle}
            onChange={handleChange}
            placeholder="cth. Jamin masa depan anda dengan emas tulen"
          />

          <h2 className="text-lg font-medium text-gold-500 pt-4">Konfigurasi Umum</h2>

          <Input
            label="Emel Hubungan"
            name="contactEmail"
            value={settings.contactEmail}
            onChange={handleChange}
            placeholder="support@goldexclude.com"
          />

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              name="maintenanceMode"
              checked={settings.maintenanceMode === 'true'}
              onChange={(e) => setSettings((prev: any) => ({ ...prev, maintenanceMode: e.target.checked ? 'true' : 'false' }))}
              className="w-4 h-4 rounded border-gray-300 text-gold-500 focus:ring-gold-500"
            />
            <span className="text-sm text-gray-300">Dayakan Mod Penyelenggaraan</span>
          </div>

          <h2 className="text-lg font-medium text-gold-500 pt-6">Notifikasi Telegram</h2>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              name="TELEGRAM_ENABLED"
              checked={settings.TELEGRAM_ENABLED === 'true'}
              onChange={(e) => setSettings((prev: any) => ({ ...prev, TELEGRAM_ENABLED: e.target.checked ? 'true' : 'false' }))}
              className="w-4 h-4 rounded border-gray-300 text-gold-500 focus:ring-gold-500"
            />
            <span className="text-sm text-gray-300">Dayakan Notifikasi Telegram</span>
          </div>

          <Input
            label="Telegram Bot Token"
            name="TELEGRAM_BOT_TOKEN"
            type="password"
            value={settings.TELEGRAM_BOT_TOKEN}
            onChange={handleChange}
            placeholder="cth. 123456:ABCDEF..."
          />

          <Input
            label="Telegram Chat ID (Group)"
            name="TELEGRAM_CHAT_ID"
            value={settings.TELEGRAM_CHAT_ID}
            onChange={handleChange}
            placeholder="cth. -1001234567890"
          />

          <div className="grid gap-3 pt-2">
            <Input
              label="Ujian mesej Telegram"
              value={telegramTestText}
              onChange={(e) => setTelegramTestText(e.target.value)}
              placeholder="cth. Ujian notifikasi Telegram"
            />
            <Button type="button" variant="secondary" onClick={handleTelegramTest} disabled={loading}>
              Hantar Ujian Telegram
            </Button>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-white/10">
          <Button type="submit" disabled={loading}>
            {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
          </Button>
        </div>
      </form>
    </div>
  );
}
