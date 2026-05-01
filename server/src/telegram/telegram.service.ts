import { Injectable } from '@nestjs/common';
import { SettingsService } from '../settings/settings.service';

function truncate(text: string, max: number) {
  if (text.length <= max) return text;
  return `${text.slice(0, Math.max(0, max - 3))}...`;
}

@Injectable()
export class TelegramService {
  constructor(private settingsService: SettingsService) {}

  private normalizeEnabled(v: any) {
    const s = String(v ?? '').trim().toLowerCase();
    if (!s) return true;
    return s === '1' || s === 'true' || s === 'yes' || s === 'on';
  }

  private async loadConfig() {
    const enabledSetting = await this.settingsService.findByKey('TELEGRAM_ENABLED').catch(() => null);
    const tokenSetting = await this.settingsService.findByKey('TELEGRAM_BOT_TOKEN').catch(() => null);
    const chatIdSetting = await this.settingsService.findByKey('TELEGRAM_CHAT_ID').catch(() => null);

    const enabled = this.normalizeEnabled(enabledSetting?.value ?? process.env.TELEGRAM_ENABLED);
    const token = String(tokenSetting?.value ?? process.env.TELEGRAM_BOT_TOKEN ?? '').trim();
    const chatId = String(chatIdSetting?.value ?? process.env.TELEGRAM_CHAT_ID ?? '').trim();

    return { enabled, token, chatId };
  }

  async isConfigured() {
    const cfg = await this.loadConfig();
    return cfg.enabled && !!cfg.token && !!cfg.chatId;
  }

  async sendMessage(textInput: string) {
    const cfg = await this.loadConfig();
    if (!cfg.enabled || !cfg.token || !cfg.chatId) return { ok: true, skipped: true };
    const text = truncate(String(textInput || '').trim(), 3900);
    if (!text) return { ok: true, skipped: true };

    const url = `https://api.telegram.org/bot${cfg.token}/sendMessage`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: cfg.chatId,
        text,
        disable_web_page_preview: true,
      }),
    });

    const data = await res.json().catch(() => null);
    if (!res.ok || (data as any)?.ok === false) {
      const desc = (data as any)?.description || res.statusText || `HTTP ${res.status}`;
      const code = (data as any)?.error_code;
      throw new Error(`Telegram sendMessage gagal: ${code ? `${code} ` : ''}${desc}`.trim());
    }
    return { ok: true };
  }

  async sendMessageSafe(text: string) {
    try {
      await this.sendMessage(text);
    } catch {
      return { ok: false };
    }
    return { ok: true };
  }
}
