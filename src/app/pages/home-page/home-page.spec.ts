import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';
import { HomePage } from './home-page';

const VIEWER = {
  id: 3,
  name: 'Vidya Viewer',
  email: 'viewer@demo.com',
  role: 'viewer' as const,
  phone: '',
  department: 'Support',
  status: 'active' as const,
  createdAt: '2026-01-04T09:00:00.000Z',
};

describe('HomePage', () => {
  let fixture: ComponentFixture<HomePage>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomePage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            currentUser: () => VIEWER,
            hasRole: (...roles: string[]) => roles.includes('viewer'),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HomePage);
    httpMock = TestBed.inject(HttpTestingController);
    await fixture.whenStable();
  });

  afterEach(() => httpMock.verify());

  it('greets the signed-in user', async () => {
    httpMock.match(() => true).forEach((request) => request.flush([]));
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Welcome back, Vidya');
  });

  it('hides the user tile from roles that cannot open user management', async () => {
    httpMock.match(() => true).forEach((request) => request.flush([]));
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).textContent).not.toContain('Users');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Gallery images');
  });

  it('keeps the page usable when a stats request fails', async () => {
    httpMock.match(() => true).forEach((request) => request.flush('boom', { status: 500, statusText: 'Error' }));
    await fixture.whenStable();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Welcome back');
    expect(text).toContain('Gallery images');
  });
});
