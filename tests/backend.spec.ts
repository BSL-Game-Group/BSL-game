import { test, expect } from '@playwright/test';
import { BACKEND_BASE } from './helpers/api';

test('backend root endpoint works', async ({ request }) => {
  const res = await request.get(`${BACKEND_BASE}/`);

  expect(res.ok()).toBeTruthy();

  const text = await res.text();
  expect(text).toContain('Backend is running');
});

test('backend API + database works', async ({ request }) => {
  const res = await request.get(`${BACKEND_BASE}/api/test`);

  expect(res.ok()).toBeTruthy();

  const body = await res.json();

  expect(body).toEqual(
    expect.objectContaining({
      message: 'Database connection works',
      time: expect.anything(),
    })
  );
});