const definitions = [
  {
    method: 'GET',
    path: '/api/student-practice/availability',
    action: 'getStudentPracticeAvailability',
    turnstileRequired: false,
    write: false,
    maxBodyBytes: 0,
  },
  {
    method: 'POST',
    path: '/api/student-practice/submit',
    action: 'submitStudentPractice',
    turnstileRequired: true,
    turnstileAction: 'student_practice_submit',
    write: true,
    maxBodyBytes: 16 * 1024,
  },
  {
    method: 'GET',
    path: '/api/vvip/members',
    action: 'getVvipMembers',
    turnstileRequired: false,
    write: false,
    maxBodyBytes: 0,
  },
  {
    method: 'POST',
    path: '/api/vvip/selection',
    action: 'getVvipSelection',
    turnstileRequired: true,
    turnstileAction: 'vvip_selection_lookup',
    write: false,
    maxBodyBytes: 16 * 1024,
  },
  {
    method: 'POST',
    path: '/api/vvip/submit',
    action: 'submitVvipSelection',
    turnstileRequired: true,
    turnstileAction: 'vvip_selection_submit',
    write: true,
    maxBodyBytes: 16 * 1024,
  },
  {
    method: 'GET',
    path: '/health',
    action: 'health',
    turnstileRequired: false,
    write: false,
    maxBodyBytes: 0,
  },
];

export const ROUTES = Object.freeze(definitions.map((route) => Object.freeze({ ...route })));

export function matchRoute(method, pathname) {
  return ROUTES.find((route) => route.method === method && route.path === pathname) || null;
}

export function hasRoutePath(pathname) {
  return ROUTES.some((route) => route.path === pathname);
}
