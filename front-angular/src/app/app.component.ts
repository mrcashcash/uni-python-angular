import { Component, OnInit, ChangeDetectorRef, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';

type ApiServerStatus = 'online' | 'offline' | 'misconfigured';
type DatabaseStatus = 'connected' | 'unconfigured' | 'disconnected' | 'unknown';

function normalizeApiUrl(value: string | null | undefined): string | null {
  const trimmed = String(value ?? '')
    .trim()
    .replace(/\/+$/, '');

  return trimmed ? trimmed : null;
}

function resolveApiBaseUrl(): string | null {
  const runtimeUrl = normalizeApiUrl(
    typeof window !== 'undefined'
      ? (window as Window & { __APP_CONFIG__?: { apiUrl?: string | null } }).__APP_CONFIG__?.apiUrl
      : null
  );

  return runtimeUrl || normalizeApiUrl(environment.apiUrl);
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  apiResponse: any = null;
  connectionFailed = false;
  apiStatus: ApiServerStatus = 'misconfigured';
  databaseStatus: DatabaseStatus = 'unknown';
  healthEndpoint = 'Not configured';

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.checkSystemStatus();
    }
  }

  checkSystemStatus() {
    const apiBaseUrl = resolveApiBaseUrl();
    if (!apiBaseUrl) {
      this.connectionFailed = true;
      this.apiStatus = 'misconfigured';
      this.databaseStatus = 'unknown';
      this.healthEndpoint = 'Not configured';
      this.apiResponse = {
        error: 'API_BASE_URL is not configured for this deployment.',
        attempted_url: null,
        details:
          'Provide API_BASE_URL at runtime (public/runtime-config.js) or rely on the development environment fallback locally.',
      };
      this.cdr.detectChanges();
      return;
    }

    this.healthEndpoint = `${apiBaseUrl}/health`;
    this.http.get(this.healthEndpoint).subscribe({
      next: (res: any) => {
        this.apiResponse = res;
        this.apiStatus = res?.server === 'up' ? 'online' : 'offline';
        this.databaseStatus = this.getDatabaseStatus(res?.database);
        this.connectionFailed = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.connectionFailed = true;
        this.apiStatus = 'offline';
        this.databaseStatus = 'unknown';
        this.apiResponse = {
          error: 'API Server is unreachable from the browser',
          attempted_url: this.healthEndpoint,
          details: err.message,
        };
        this.cdr.detectChanges();
      },
    });
  }

  getApiBadgeClass() {
    return this.apiStatus === 'online'
      ? 'badge-success'
      : this.apiStatus === 'misconfigured'
        ? 'badge-warning'
        : 'badge-error';
  }

  getApiStatusLabel() {
    return this.apiStatus === 'online'
      ? 'ONLINE'
      : this.apiStatus === 'misconfigured'
        ? 'MISCONFIGURED'
        : 'OFFLINE';
  }

  getDatabaseBadgeClass() {
    return this.databaseStatus === 'connected'
      ? 'badge-success'
      : this.databaseStatus === 'unconfigured'
        ? 'badge-warning'
        : this.databaseStatus === 'unknown'
          ? 'badge-neutral'
          : 'badge-error';
  }

  getDatabaseStatusLabel() {
    switch (this.databaseStatus) {
      case 'connected':
        return 'CONNECTED';
      case 'unconfigured':
        return 'UNCONFIGURED';
      case 'disconnected':
        return 'DISCONNECTED';
      default:
        return 'UNKNOWN';
    }
  }

  private getDatabaseStatus(value: unknown): DatabaseStatus {
    const normalized = String(value ?? '')
      .trim()
      .toLowerCase();

    if (normalized === 'connected') {
      return 'connected';
    }

    if (normalized === 'disconnected') {
      return 'disconnected';
    }

    if (normalized.includes('unconfigured')) {
      return 'unconfigured';
    }

    return 'unknown';
  }
}
