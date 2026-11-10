const Problem = require('api-problem');

// Far deeper than any form design or submission, and far below the depth where storing a body
// overflows the call stack (somewhere between 3,000 and 5,000 levels)
const MAX_JSON_DEPTH = 500;

// A cursor over one object or array; arrays are read in place rather than copied
const openContainer = (container) => ({ container, keys: Array.isArray(container) ? null : Object.keys(container), index: 0 });

// The cursor's next child, or undefined once it has none left
const nextChild = (cursor) => {
  const size = cursor.keys ? cursor.keys.length : cursor.container.length;
  if (cursor.index >= size) return undefined;
  const at = cursor.index++;
  return { value: cursor.keys ? cursor.container[cursor.keys[at]] : cursor.container[at] };
};

/**
 * The nesting depth of a parsed JSON value: 0 for a primitive, 1 for an object or array that
 * holds only primitives. Keeps one cursor per open container, holding that object's keys
 * (arrays are read in place), so memory grows with the depth and the widest open object, not
 * with the whole value; stops once the depth passes the limit.
 *
 * @param {*} value the parsed JSON value.
 * @param {number} limit stop counting once the depth passes this.
 * @returns {number} the depth, or the first depth past the limit.
 */
const jsonDepth = (value, limit = Infinity) => {
  if (typeof value !== 'object' || value === null) return 0;
  let max = 1;
  const stack = [openContainer(value)];
  while (stack.length) {
    const child = nextChild(stack.at(-1));
    if (!child) {
      stack.pop();
    } else if (typeof child.value === 'object' && child.value !== null) {
      stack.push(openContainer(child.value));
      max = Math.max(max, stack.length);
      if (max > limit) return max;
    }
  }
  return max;
};

/**
 * Rejects a JSON body nested deeper than the limit with 400. Code that walks or stores the body
 * recursively, such as saving a submission, would otherwise exhaust the call stack.
 *
 * @param {number} limit the deepest nesting allowed.
 * @returns {function} the Express middleware.
 */
const limitJsonDepth =
  (limit = MAX_JSON_DEPTH) =>
  (req, _res, next) => {
    if (jsonDepth(req.body, limit) > limit) {
      return next(new Problem(400, { detail: `The request body is nested more than ${limit} levels deep.` }));
    }
    return next();
  };

module.exports = { jsonDepth, limitJsonDepth, MAX_JSON_DEPTH };
