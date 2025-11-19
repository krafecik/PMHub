export * from './commands';
export * from './queries';
export * from './events';

import { TriagemCommandHandlers } from './commands';
import { TriagemQueryHandlers } from './queries';
import { TriagemEventHandlers } from './events';

export const TriagemHandlers = [
  ...TriagemCommandHandlers,
  ...TriagemQueryHandlers,
  ...TriagemEventHandlers,
];
