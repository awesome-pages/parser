import { setupServer } from 'msw/node';

import { handlers as httpRawHandlers } from '@/sources/__mocks__/httpRaw.handlers';
import { handlers as githubHandlers } from '@/sources/__mocks__/github.handlers';

export const server = setupServer(...httpRawHandlers, ...githubHandlers);
