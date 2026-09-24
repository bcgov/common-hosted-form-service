const emailService = require('../../email/emailService');
const jobService = require('./jobService');
const contextResolver = require('./contextResolver');
const packageBuilder = require('./packageBuilder');
const delivery = require('./delivery');
const linkStrategy = require('./delivery/linkStrategy');
const { PermanentError } = require('./errors');

const service = {
  /**
   * Process a single claimed package job. Orchestrates the pipeline:
   *   1. resolve context (submission, form, version, template, allowed)
   *   2. examine + gate (fail / skip / proceed) — each branch logged
   *   3. resolve attachments
   *   4. render the report (shared by all delivery strategies)
   *   5. pick a delivery strategy
   *   6. strategy builds the package + email payload
   *   7. send
   *
   * Missing/misconfigured inputs throw PermanentError (no retry). Transient
   * failures (CDOGS, storage, CHES, DB) throw ordinary errors and are retried.
   *
   * Returns `{ skipped: true }` when the job did no work by design (form not
   * allowlisted / setting off / no recipients) so the worker can mark it SKIPPED
   * rather than COMPLETED; returns undefined when the email was sent.
   */
  process: async ({ jobId, formId, submissionId, packageFileId, logger }) => {
    // Log lines are buffered in memory (logger) and flushed once at the terminal
    // state by markCompleted/markFailed — no DB write per line.
    const log = (message) => logger.add(message);

    // --- 1 & 2. Resolve context, then examine + gate.
    const ctx = await contextResolver.resolve({ formId, submissionId });

    if (!ctx.submission) throw new PermanentError(`Submission ${submissionId} not found.`);
    if (ctx.submission.submission.deleted) throw new PermanentError(`Submission ${submissionId} has been deleted.`);
    log(`Found submission: ${ctx.submission.submission.id}.`);

    if (!ctx.form) throw new PermanentError(`Form ${formId} not found.`);
    log(`Found form: ${ctx.form.id} (${ctx.form.name}).`);
    log(`Found version: ${ctx.version}.`);

    if (!ctx.allowed || !ctx.settings?.enabled) {
      log('Skipped: submitToEmail is not active for this form, or the setting is off.');
      return { skipped: true };
    }
    if (!ctx.settings.emails?.length) {
      log('Skipped: no recipient emails configured.');
      return { skipped: true };
    }

    // --- Build-once / send-retry: a prior attempt already built + stored the
    //     package (link delivery). Skip the whole build pipeline and just resend
    //     the link — no re-render, no re-zip, no orphaned upload.
    if (packageFileId) {
      log(`Resending previously built package (file ${packageFileId}).`);
      const { configData, contexts } = linkStrategy.buildEmail({
        form: ctx.form,
        submission: ctx.submission,
        recipients: ctx.settings.emails,
        fileId: packageFileId,
      });
      await emailService._sendEmailTemplate(configData, contexts);
      log('Submission package email sent.');
      return;
    }

    if (!ctx.settings.templateId) {
      throw new PermanentError('No document template is configured on the form.');
    }
    if (!ctx.template) {
      throw new PermanentError(`Document template ${ctx.settings.templateId} not found.`);
    }
    log(`Found template: ${ctx.template.id} (${ctx.template.filename}).`);

    // --- 3. Resolve attachments.
    const { files, missing } = await packageBuilder.getSubmissionFiles(ctx.submission);
    for (const [index, file] of files.entries()) {
      log(`Found attachment (${index + 1}): ${file.id} (${file.filename}).`);
    }
    for (const file of missing) {
      log(`Attachment unreadable, skipped: ${file.id} (${file.name}) — ${file.reason}.`);
    }

    // --- 4. Render the report (shared by every delivery strategy).
    const report = await packageBuilder.renderReport({ submission: ctx.submission, template: ctx.template });
    log(`Report rendered: ${report.filename} (${report.buffer.length} bytes).`);

    // --- 5. Choose a delivery strategy by size (inline attachments vs zip+link).
    const { strategy, reason } = delivery.decide({ report, files });
    log(`Delivery method: ${strategy.name} — ${reason}.`);

    // --- 6. Strategy builds the package + email payload.
    const { configData, contexts, summary, fileId } = await strategy.prepare({
      form: ctx.form,
      submission: ctx.submission,
      template: ctx.template,
      report,
      files,
      recipients: ctx.settings.emails,
    });
    log(summary);

    // Persist the stored package id (link delivery) BEFORE sending, so if the
    // send fails the retry resends this file instead of rebuilding it.
    if (fileId) {
      await jobService.setPackageFileId(jobId, fileId);
    }

    // --- 7. Send (awaited; a send failure fails the job and is retried).
    await emailService._sendEmailTemplate(configData, contexts);
    log('Submission package email sent.');
  },
};

module.exports = service;
