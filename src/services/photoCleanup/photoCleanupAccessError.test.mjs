import assert from 'node:assert/strict';
import test from 'node:test';
import { isAccessDeniedFunctionError } from './photoCleanupAccessError.ts';

function functionsHttpError(status) {
  const error = new Error('Edge Function returned a non-2xx status code');
  error.name = 'FunctionsHttpError';
  error.context = { status };
  return error;
}

test('treats a 403 from the edge function as access denied', () => {
  assert.equal(isAccessDeniedFunctionError(functionsHttpError(403)), true);
});

test('leaves other edge function statuses as ordinary failures', () => {
  assert.equal(isAccessDeniedFunctionError(functionsHttpError(500)), false);
  assert.equal(isAccessDeniedFunctionError(functionsHttpError(401)), false);
});

test('ignores errors that did not come from an edge function response', () => {
  const error = new Error('Network request failed');
  error.context = { status: 403 };
  assert.equal(isAccessDeniedFunctionError(error), false);
  assert.equal(isAccessDeniedFunctionError(null), false);
  assert.equal(isAccessDeniedFunctionError({ name: 'FunctionsHttpError', context: { status: 403 } }), false);
});
