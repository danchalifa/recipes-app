// One shared password, checked server side, exchanged for a signed cookie.
//
// The /admin route being absent from the UI is not what keeps strangers out --
// the admin component ships inside the public JS bundle, so anyone who looks
// will find the route. This module is the actual boundary: every write goes
// through verifyRequest() below, and an unauthenticated caller gets a 401 no
// matter how they found the page.

const crypto = require('crypto');

const COOKIE_NAME = 'rdm_admin';
const SESSION_MS = 12 * 60 * 60 * 1000;

const requireEnv = (name) => {
  const value = process.env[name];
  if (!value) throw new Error(`${name} must be configured`);
  return value;
};

// timingSafeEqual throws on length mismatch, which would itself leak the length
// of the secret. Hashing both sides first makes every comparison fixed-width.
const safeEqual = (a, b) => {
  const left = crypto.createHash('sha256').update(String(a)).digest();
  const right = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(left, right);
};

const checkPassword = (supplied) =>
  typeof supplied === 'string' &&
  supplied.length > 0 &&
  safeEqual(supplied, requireEnv('ADMIN_PASSWORD'));

// The expiry is part of the signed payload, so a client cannot extend its own
// session by editing the cookie.
const signToken = (expiresAt) => {
  const mac = crypto
    .createHmac('sha256', requireEnv('ADMIN_SECRET'))
    .update(String(expiresAt))
    .digest('hex');
  return `${expiresAt}.${mac}`;
};

const issueToken = () => signToken(Date.now() + SESSION_MS);

const verifyToken = (token) => {
  if (typeof token !== 'string' || !token) return false;
  const [expires] = token.split('.');
  if (!/^\d+$/.test(expires || '')) return false;
  if (Number(expires) < Date.now()) return false;
  return safeEqual(token, signToken(expires));
};

const parseCookies = (header) =>
  String(header || '')
    .split(';')
    .reduce((acc, part) => {
      const index = part.indexOf('=');
      if (index > 0) acc[part.slice(0, index).trim()] = part.slice(index + 1).trim();
      return acc;
    }, {});

const verifyRequest = (req) =>
  verifyToken(parseCookies(req.headers && req.headers.cookie)[COOKIE_NAME]);

const cookieHeader = (token, maxAgeSeconds) => {
  const parts = [
    `${COOKIE_NAME}=${token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Strict',
    `Max-Age=${maxAgeSeconds}`,
  ];
  // Secure on http://localhost would stop the browser storing the cookie at all,
  // so the dev server would never be able to log in.
  if (process.env.NODE_ENV === 'production') parts.push('Secure');
  return parts.join('; ');
};

const loginCookie = () => cookieHeader(issueToken(), Math.floor(SESSION_MS / 1000));
const logoutCookie = () => cookieHeader('', 0);

module.exports = { checkPassword, verifyRequest, loginCookie, logoutCookie };
