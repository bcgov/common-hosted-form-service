const JSZip = require('jszip');
const config = require('config');
const uuid = require('uuid');

const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');

const cdogsService = require('../../../components/cdogsService');
const log = require('../../../components/log')(module.filename);

const documentTemplateService = require('../../form/documentTemplate/service');
const fileService = require('../../file/service');
const storageService = require('../../file/storage/storageService');

const { chefsTemplate } = require('../../common/utils');
const { StorageTypes } = require('../../common/constants');

const PERMANENT_STORAGE = config.get('files.permanent');

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

const service = {
  /**
   * Find CHEFS uploaded files inside the submission payload.
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

    walk(submission?.submission?.data);

    return files;
  },

  /**
   * Render the configured document template using CDOGS.
   */
  renderSubmissionTemplate: async ({ form, submission, convertTo = 'pdf', body = {} }) => {
    if (!form.submissionCompletionTemplateId) {
      throw new Error('No submissionCompletionTemplateId configured on form.');
    }

    const template = await documentTemplateService.documentTemplateRead(form.submissionCompletionTemplateId);

    const fileName = template.filename.substring(0, template.filename.lastIndexOf('.'));
    const fileExtension = template.filename.substring(template.filename.lastIndexOf('.') + 1);

    const submissionFormVersion = form.versions.find((v) => v.id === submission.formVersionId)?.version;

    const cdogsSubData = chefsTemplate({
      version: submissionFormVersion,
      submission,
    });

    const templateBody = {
      ...body,
      data: cdogsSubData,
      options: {
        convertTo,
        overwrite: true,
        reportName: fileName,
      },
      template: {
        content: template.template.toString(),
        encodingType: 'base64',
        fileType: fileExtension,
      },
    };

    const { data } = await cdogsService.templateUploadAndRender(templateBody);

    return {
      filename: `${safeFileName(fileName)}.${convertTo}`,
      buffer: Buffer.isBuffer(data) ? data : Buffer.from(data),
    };
  },

  /**
   * Read all uploaded submission files from storage.
   */
  getSubmissionFiles: async (submission) => {
    const submissionFiles = service.findFiles(submission);
    const files = [];

    for (const file of submissionFiles) {
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
      }
    }

    return files;
  },

  /**
   * Build the ZIP in memory.
   */
  buildSubmissionPackage: async ({ form, submission, convertTo = 'pdf' }) => {
    const zip = new JSZip();

    const renderedTemplate = await service.renderSubmissionTemplate({
      form,
      submission,
      convertTo,
    });

    zip.file(renderedTemplate.filename, renderedTemplate.buffer);

    const files = await service.getSubmissionFiles(submission);

    files.forEach((file, index) => {
      zip.file(`attachments/${index + 1}-${file.filename}`, file.buffer);
    });

    const zipBuffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
    });

    return {
      filename: `${safeFileName(form.name)}-${submission.confirmationId}.zip`,
      contentType: 'application/zip',
      buffer: zipBuffer,
      fileCount: files.length,
    };
  },

  /**
   * Build ZIP, upload it through fileService, and return the created file record.
   */
  writeSubmissionPackage: async ({ form, submission, folder = 'uploads', convertTo = 'pdf' }) => {
    const zip = await service.buildSubmissionPackage({
      form,
      submission,
      convertTo,
    });

    const tempPath = path.join(os.tmpdir(), `${uuid.v4()}-${zip.filename}`);

    await fs.writeFile(tempPath, zip.buffer);

    try {
      const fileRecord = await fileService.create(
        {
          originalname: zip.filename,
          mimetype: zip.contentType,
          size: zip.buffer.length,
          path: tempPath,
        },
        WORKER_USER,
        folder
      );

      return {
        fileRecord,
        filename: zip.filename,
        contentType: zip.contentType,
        size: zip.buffer.length,
        fileCount: zip.fileCount,
      };
    } finally {
      //Running this locally will simply "upload" the files into the /tmp/ folder in the container
      if (PERMANENT_STORAGE !== StorageTypes.LOCAL_STORAGE) {
        await fs.rm(tempPath, { force: true });
      }
    }
  },
};

module.exports = service;
