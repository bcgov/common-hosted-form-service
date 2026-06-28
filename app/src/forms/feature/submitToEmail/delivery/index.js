const config = require('../config');
const linkStrategy = require('./linkStrategy');
const attachmentStrategy = require('./attachmentStrategy');

const service = {
  linkStrategy,
  attachmentStrategy,

  /**
   * Choose a delivery strategy.
   *
   * With `delivery: 'link'` configured, always use the stored zip + download
   * link (handy for testing/demos). With `delivery: 'attachment'` (default),
   * decide by size: deliver inline if the rendered report and the attachments
   * are all within the configured limits, otherwise fall back to the
   * always-viable link.
   *
   * @returns {{ strategy, reason }} the chosen strategy and a human-readable
   *   reason (for the job log).
   */
  decide: ({ report, files }) => {
    const { delivery, reportSizeLimit, attachmentsSizeLimit, attachmentsCountLimit } = config.getConfig();

    if (delivery === 'link') {
      return { strategy: linkStrategy, reason: 'configured delivery=link' };
    }

    const reportSize = report.buffer.length;
    const totalSize = files.reduce((sum, file) => sum + file.buffer.length, 0);
    const count = files.length;

    if (reportSize > reportSizeLimit) {
      return { strategy: linkStrategy, reason: `report ${reportSize} bytes exceeds limit ${reportSizeLimit}` };
    }
    if (totalSize > attachmentsSizeLimit) {
      return { strategy: linkStrategy, reason: `attachments ${totalSize} bytes exceed limit ${attachmentsSizeLimit}` };
    }
    if (count > attachmentsCountLimit) {
      return { strategy: linkStrategy, reason: `${count} attachments exceed limit ${attachmentsCountLimit}` };
    }

    return { strategy: attachmentStrategy, reason: `within limits (report ${reportSize} bytes, ${count} file(s) ${totalSize} bytes)` };
  },
};

module.exports = service;
