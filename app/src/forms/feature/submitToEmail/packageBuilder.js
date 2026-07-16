const JSZip = require('jszip');
const config = require('config');
const uuid = require('uuid');

const fs = require('node:fs/promises');
const path = require('node:path');

const cdogsService = require('../../../components/cdogsService');
const log = require('../../../components/log')(module.filename);

const fileService = require('../../file/service');
const storageService = require('../../file/storage/storageService');
const { fileUpload } = require('../../file/middleware/upload');
const { FileStorage } = require('../../common/models');

const { chefsTemplate } = require('../../common/utils');

const PERMANENT_STORAGE = config.get('files.permanent');

// Sub-directory (under the storage root) the built packages are moved into.
const PACKAGE_FOLDER = 'submission-packages';

const WORKER_USER = {
  username: 'submission-package-worker',
  idpUserId: 'submission-package-worker',
};

const streamToBuffer = async (stream) =>
  new Promise((resolve, reject) => {
    const chunks = [];

    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });

const safeFileName = (name = 'file') => name.replace(/[\\/:*?"<>|]/g, '_');

// Toolkit of building blocks for the submitToEmail delivery strategies. Pure
// builders — no job logging, no policy. The processor orchestrates these and a
// strategy composes them (e.g. link = renderReport + buildZip + uploadPackage).
const service = {
  /**
   * Find CHEFS uploaded files inside the submission payload. `submission` is the
   * composite from submissionService.read(); the submitted field data is at
   * submission.submission.submission.data.
   */
  findFiles: (submission) => {
    const files = [];
    const seen = new Set();

    const walk = (current) => {
      if (Array.isArray(current)) {
        current.forEach(walk);
        return;
      }

      if (!current || typeof current !== 'object') {
        return;
      }

      if (typeof current.originalName === 'string' && current.data?.id && uuid.validate(current.data.id)) {
        if (!seen.has(current.data.id)) {
          seen.add(current.data.id);

          files.push({
            id: current.data.id,
            originalName: current.originalName,
            size: current.size,
            url: current.url,
          });
        }

        return;
      }

      Object.values(current).forEach(walk);
    };

    walk(submission?.submission?.submission?.data);

    return files;
  },

  /**
   * Resolve the submission's uploaded files from storage. Returns the files that
   * were read (with buffers) and a `missing` list for any that couldn't be read,
   * so the caller (processor) can log each outcome. Does not throw for a single
   * unreadable file.
   */
  getSubmissionFiles: async (submission) => {
    const submissionFiles = service.findFiles(submission);
    const files = [];
    const missing = [];

    for (const file of submissionFiles) {
      const name = file.originalName || file.id;
      try {
        const fileRecord = await fileService.read(file.id);
        const stream = await storageService.read(fileRecord);
        const buffer = await streamToBuffer(stream);

        files.push({
          id: file.id,
          filename: safeFileName(file.originalName || fileRecord.id),
          mimeType: fileRecord.mimeType,
          buffer,
        });
      } catch (error) {
        log.error('Failed to read submission file', {
          file,
          error: error.message,
        });
        missing.push({ id: file.id, name, reason: error.message });
      }
    }

    return { files, missing };
  },

  /**
   * Render the given document template against the submission via CDOGS.
   * Returns { filename, buffer } for the rendered report. `submission` is the
   * composite from submissionService.read().
   */
  renderReport: async ({ submission, template, convertTo = 'pdf', body = {} }) => {
    const templateName = template.filename.substring(0, template.filename.lastIndexOf('.'));
    const fileExtension = template.filename.substring(template.filename.lastIndexOf('.') + 1);

    // Keep the template's name (authors control it by naming the template) and
    // suffix the submission's confirmation id, so reports sort/group and can be
    // stored together in one directory for later processing.
    const reportName = `${safeFileName(templateName)}-${submission.submission.confirmationId}`;

    const cdogsSubData = chefsTemplate(submission);

    const templateBody = {
      ...body,
      data: cdogsSubData,
      options: {
        convertTo,
        overwrite: true,
        reportName,
      },
      template: {
        content: template.template.toString(),
        encodingType: 'base64',
        fileType: fileExtension,
      },
    };

    const { data } = await cdogsService.templateUploadAndRender(templateBody);

    return {
      filename: `${reportName}.${convertTo}`,
      buffer: Buffer.isBuffer(data) ? data : Buffer.from(data),
    };
  },

  /**
   * Zip the rendered report together with the submission's attachment files.
   * Returns the in-memory zip plus metadata.
   */
  buildZip: async ({ form, submission, report, files = [] }) => {
    const zip = new JSZip();

    zip.file(report.filename, report.buffer);

    files.forEach((file, index) => {
      zip.file(`attachments/${index + 1}-${file.filename}`, file.buffer);
    });

    const buffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
    });

    return {
      // confirmationId lives on the submission record within the composite.
      filename: `${safeFileName(form.name)}-${submission.submission.confirmationId}.zip`,
      contentType: 'application/zip',
      buffer,
      fileCount: files.length,
    };
  },

  /**
   * Convert an in-memory file to a CHES AttachmentObject (base64-encoded). When
   * contentType is omitted CHES derives it from the filename extension.
   */
  toChesAttachment: ({ filename, buffer, contentType }) => ({
    filename,
    content: buffer.toString('base64'),
    encoding: 'base64',
    ...(contentType && { contentType }),
  }),

  /**
   * Persist an in-memory package (e.g. the zip) through fileService and return
   * the created file record.
   */
  uploadPackage: async ({ filename, contentType, buffer }, folder = 'uploads') => {
    // Stage inside the upload dir (not the bare OS temp dir): objectStorageService
    // reads the temp file back through a containment check scoped to
    // getFileUploadsDir(), so a file outside it makes fileService.create throw.
    const tempPath = path.join(fileUpload.getFileUploadsDir(), `${uuid.v4()}-${filename}`);

    await fs.writeFile(tempPath, buffer);

    try {
      const fileRecord = await fileService.create(
        {
          originalname: filename,
          mimetype: contentType,
          size: buffer.length,
          path: tempPath,
        },
        WORKER_USER,
        folder
      );

      // fileService.create leaves the file at its upload location (for local
      // storage that's the temp path — uploadFile is a no-op). Move it into
      // permanent storage and track the new path, the same way submission files
      // are relocated after upload. Without this the package stays in /tmp.
      const newPath = await storageService.move(fileRecord, PACKAGE_FOLDER);
      if (!newPath) {
        throw new Error(`Failed to move package ${fileRecord.id} into permanent storage.`);
      }

      return FileStorage.query().patchAndFetchById(fileRecord.id, {
        storage: PERMANENT_STORAGE,
        path: newPath,
        updatedBy: WORKER_USER.username,
      });
    } finally {
      // The move relocates the temp file out (local rename); for object storage
      // the temp copy remains, so always clean it up.
      await fs.rm(tempPath, { force: true });
    }
  },
};

module.exports = service;
