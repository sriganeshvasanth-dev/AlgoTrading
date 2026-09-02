import { Injectable } from '@angular/core';
import { ConfigService } from './config.service';
import { API_CONFIG } from '../config/api.config';

/**
 * HTTP Client Wrapper Service
 * Provides common HTTP functionality with authentication for Delta Exchange API
 * Centralized place for all API calls, signature generation, and header management
 */
@Injectable({
  providedIn: 'root'
})
export class HttpClientService {
  private apiKey: string = '';
  private apiSecret: string = '';
  private baseUrl: string = API_CONFIG.base_url;

  constructor() {}

  /**
   * Set API credentials
   * Called by DeltaService after loading credentials
   */
  setCredentials(apiKey: string, apiSecret: string): void {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
  }

  /**
   * Ensure credentials are loaded before making requests
   */
  private ensureCredentialsLoaded(): void {
    if (!this.apiKey || !this.apiSecret) {
      throw new Error('API credentials not set. Call setCredentials() first.');
    }
  }

  /**
   * Generate HMAC-SHA256 signature for request authentication
   */
  private async generateSignature(
    timestamp: string,
    method: string,
    path: string,
    body: string = ''
  ): Promise<string> {
    const message = method.toUpperCase() + timestamp + path + body;
    const encoder = new TextEncoder();

    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(this.apiSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signatureBuffer = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(message)
    );

    const signatureBytes = Array.from(new Uint8Array(signatureBuffer));
    return signatureBytes.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Get authentication headers for API request
   */
  private async getAuthHeaders(
    path: string,
    method: string = 'GET',
    body: string = ''
  ): Promise<{ [key: string]: string }> {
    this.ensureCredentialsLoaded();

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = await this.generateSignature(timestamp, method, path, body);

    return {
      'api-key': this.apiKey,
      'signature': signature,
      'timestamp': timestamp
    };
  }

  /**
   * Make authenticated HTTP request to Delta Exchange API
   */
  async request<T = any>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    path: string,
    body?: any,
    host: string = this.baseUrl
  ): Promise<T> {
    this.ensureCredentialsLoaded();

    const bodyString = body ? JSON.stringify(body) : '';
    const authHeaders = await this.getAuthHeaders(path, method, bodyString);

    const headers: Record<string, string> = {
      ...authHeaders
    };

    if (method === 'POST' || method === 'PUT' || method === 'DELETE') {
      headers['Content-Type'] = 'application/json';
    }

    try {
      const response = await fetch(`${host}${path}`, {
        method,
        headers,
        body: (method === 'POST' || method === 'PUT' || method === 'DELETE') ? bodyString : undefined
      });

      const json = await response.json().catch(() => ({}));

      if (!response.ok) {
        const errorMessage =
          json?.error?.code ||
          json?.error?.message ||
          json?.error ||
          json?.message ||
          `${response.status} ${response.statusText}`;
        throw new Error(String(errorMessage));
      }

      return (json?.result ?? json?.data ?? json) as T;
    } catch (error) {
      throw new Error(`HTTP Request failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * GET request helper
   */
  async get<T = any>(path: string, host?: string): Promise<T> {
    return this.request<T>('GET', path, undefined, host || this.baseUrl);
  }

  /**
   * POST request helper
   */
  async post<T = any>(path: string, body?: any, host?: string): Promise<T> {
    return this.request<T>('POST', path, body, host || this.baseUrl);
  }

  /**
   * PUT request helper
   */
  async put<T = any>(path: string, body?: any, host?: string): Promise<T> {
    return this.request<T>('PUT', path, body, host || this.baseUrl);
  }

  /**
   * DELETE request helper
   */
  async delete<T = any>(path: string, body?: any, host?: string): Promise<T> {
    return this.request<T>('DELETE', path, body, host || this.baseUrl);
  }
}
