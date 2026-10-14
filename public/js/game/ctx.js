// Shared runtime context so modules can reach each other without import cycles.
import { S } from '../core/state.js';
export const G = {
  world: null, ui: null, audio: null, game: null, sdk: null,
  get s() { return S.state; },
  flow: null, // currently active flow name
};
