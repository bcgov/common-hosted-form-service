/**
 * Shared Basic auth parsing for formId:apiKey credentials.
 */

function parseBasicPair(header) {
  try {
    const base64 = header.replace(/^Basic\s+/i, '');
    const decoded = Buffer.from(base64, 'base64').toString('utf8');
    const idx = decoded.indexOf(':');
    if (idx === -1) return null;
    return { formId: decoded.slice(0, idx), apiKey: decoded.slice(idx + 1) };
  } catch {
    return null;
  }
}

module.exports = {
  parseBasicPair,
};
