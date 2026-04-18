import type {
  AuthTokens,
  Conversation,
  Message,
  ModelSelection,
  OllamaModel,
  Page,
  PoolAccount,
  SendMessageRequest,
  SettingsData,
  StreamChunk,
  SystemInfo,
  Topic,
  User,
} from '@/types';

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080/api';

class ApiClient {
  private accessToken: string | null = null;

  setToken(token: string | null) {
    this.accessToken = token;
  }

  private headers(extra?: Record<string, string>): HeadersInit {
    const h: Record<string, string> = {
      'Content-Type': 'application/json',
      ...extra,
    };
    if (this.accessToken) h['Authorization'] = `Bearer ${this.accessToken}`;
    return h;
  }

  private async request<T>(
    path: string,
    init: RequestInit = {}
  ): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: { ...this.headers(), ...(init.headers as Record<string, string> | undefined) },
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({ message: res.statusText }));
      throw Object.assign(new Error(body.message ?? res.statusText), {
        status: res.status,
        code: body.code ?? 'UNKNOWN',
      });
    }
    return res.json() as Promise<T>;
  }

  // Auth
  async signIn(email: string, password: string): Promise<AuthTokens> {
    return this.request('/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    return this.request('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  }

  async signOut(): Promise<void> {
    return this.request('/auth/signout', { method: 'POST' });
  }

  // User
  async getMe(): Promise<User> {
    return this.request('/users/me');
  }

  async updateMe(updates: Partial<Pick<User, 'displayName' | 'bio' | 'avatarUrl'>>): Promise<User> {
    return this.request('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  // Settings
  async getSettings(): Promise<SettingsData> {
    return this.request('/settings');
  }

  async updateSettings(updates: Partial<SettingsData>): Promise<SettingsData> {
    return this.request('/settings', {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  // Conversations (sessions)
  async listConversations(page = 1, pageSize = 50): Promise<Page<Conversation>> {
    return this.request(`/claw/conversations?page=${page}&pageSize=${pageSize}`);
  }

  async getConversation(id: string): Promise<Conversation> {
    return this.request(`/claw/conversations/${id}`);
  }

  async createConversation(topicId?: string): Promise<Conversation> {
    return this.request('/claw/conversations', {
      method: 'POST',
      body: JSON.stringify({ topicId: topicId ?? null }),
    });
  }

  async deleteConversation(id: string): Promise<void> {
    return this.request(`/claw/conversations/${id}`, { method: 'DELETE' });
  }

  async generateTitle(id: string): Promise<{ title: string }> {
    return this.request(`/claw/conversations/${id}/generate-title`, {
      method: 'POST',
    });
  }

  async backfillUntitledTitles(): Promise<{ updated: number; skipped: number }> {
    return this.request('/claw/conversations/backfill-titles', {
      method: 'POST',
    });
  }

  // Messages
  async listMessages(conversationId: string): Promise<Page<Message>> {
    return this.request(`/claw/conversations/${conversationId}/messages?pageSize=200`);
  }

  sendMessage(req: SendMessageRequest): EventSource {
    const url = new URL(`${BASE_URL}/claw/chat/stream`);
    if (this.accessToken) url.searchParams.set('token', this.accessToken);
    const es = new EventSource(url.toString());
    fetch(`${BASE_URL}/claw/chat/stream`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(req),
    });
    return es;
  }

  async sendMessageRaw(req: SendMessageRequest): Promise<ReadableStream<StreamChunk>> {
    const res = await fetch(`${BASE_URL}/claw/chat/stream`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(req),
    });
    if (!res.ok || !res.body) throw new Error('Stream failed');
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    return new ReadableStream<StreamChunk>({
      async pull(controller) {
        const { done, value } = await reader.read();
        if (done) {
          controller.close();
          return;
        }
        const text = decoder.decode(value);
        for (const line of text.split('\n')) {
          if (line.startsWith('data: ')) {
            const chunk = JSON.parse(line.slice(6)) as StreamChunk;
            controller.enqueue(chunk);
          }
        }
      },
    });
  }

  // Topics
  async listTopics(): Promise<Topic[]> {
    return this.request('/claw/topics');
  }

  async getTopicTree(): Promise<Topic[]> {
    return this.request('/claw/topics/tree');
  }

  // Models
  async listModels(): Promise<OllamaModel[]> {
    return this.request('/claw/models');
  }

  async getSystemInfo(): Promise<SystemInfo> {
    return this.request('/claw/system-info');
  }

  async getModelSelection(): Promise<ModelSelection> {
    return this.request('/claw/models/selection');
  }

  async setModelSelection(sel: ModelSelection): Promise<ModelSelection> {
    return this.request('/claw/models/selection', {
      method: 'PUT',
      body: JSON.stringify(sel),
    });
  }

  async pullModel(modelId: string): Promise<{ taskId: string }> {
    return this.request('/claw/models/pull', {
      method: 'POST',
      body: JSON.stringify({ modelId }),
    });
  }

  // Pool accounts
  async listPoolAccounts(): Promise<PoolAccount[]> {
    return this.request('/claw/pool');
  }

  async addPoolAccount(provider: PoolAccount['provider']): Promise<{ oauthUrl: string }> {
    return this.request('/claw/pool', {
      method: 'POST',
      body: JSON.stringify({ provider }),
    });
  }

  async removePoolAccount(id: string): Promise<void> {
    return this.request(`/claw/pool/${id}`, { method: 'DELETE' });
  }

  async refreshPoolAccount(id: string): Promise<PoolAccount> {
    return this.request(`/claw/pool/${id}/refresh`, { method: 'POST' });
  }
}

export const api = new ApiClient();
export default api;
