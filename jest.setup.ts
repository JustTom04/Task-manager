import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

// Polyfill Node globals required by Prisma/cuid2 in jsdom environment
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder;
}

if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = TextDecoder as typeof global.TextDecoder;
}
