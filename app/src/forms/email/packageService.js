const JSZip = require('jszip');
const config = require('config');

const cdogsService = require('../../components/cdogsService');
const log = require('../../components/log')(module.filename);

const documentTemplateService = require('../form/documentTemplate/service');
const fileService = require('../file/service');
const storageService = require('../file/storage/storageService');

const { chefsTemplate } = require('../common/utils');
const uuid = require('uuid');

const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');

const PERMANENT_STORAGE = config.get('files.permanent');
const { StorageTypes } = require('../common/constants');

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
   * Given the data for a submission, find uploaded files.
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
   * Render the configured document template for a submission.
   */
  renderSubmissionTemplate: async ({ form, submission, documentTemplateId, convertTo = 'pdf', body = {} }) => {
    const template = await documentTemplateService.documentTemplateRead(documentTemplateId);
    const fileName = template.filename.substring(0, template.filename.lastIndexOf('.'));

    const fileExtension = template.filename.substring(template.filename.lastIndexOf('.') + 1);
    //Retrieve the version of form the submission was created with

    const submissionFormVersion = form.versions.find((v) => v.id === submission.formVersionId)?.version;

    const cdogsSubData = chefsTemplate({ version: submissionFormVersion, submission });

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
   * Download all uploaded files associated with a submission.
   */
  getSubmissionFiles: async (submission) => {
    const subFiles = service.findFiles(submission);

    const files = [];

    for (const file of subFiles) {
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
        // console.log('Successfully retrieved file', {
        //   id: file.id,
        //   filename: file.originalName,
        //   size: buffer.length,
        // });
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
   * Build a zip package containing:
   *  - rendered document template
   *  - all uploaded submission files
   */
  buildSubmissionPackage: async ({ form, submission, convertTo = 'pdf' }) => {
    if (!form.submissionCompletionTemplateId) {
      throw new Error('No submissionCompletionTemplateId configured on form.');
    }

    const zip = new JSZip();

    //
    // Rendered template
    //
    const renderedTemplate = await service.renderSubmissionTemplate({
      form,
      submission,
      documentTemplateId: form.submissionCompletionTemplateId,
      convertTo,
    });

    zip.file(renderedTemplate.filename, renderedTemplate.buffer);

    //
    // Uploaded files
    //
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
   * Build CHES-compatible attachment payload.
   */
  buildEmailAttachment: async (form, submission, convertTo = 'pdf') => {
    const zip = await service.buildSubmissionPackage({
      form,
      submission,
      convertTo,
    });

    return {
      filename: zip.filename,
      contentType: zip.contentType,
      encoding: 'base64',
      content: zip.buffer.toString('base64'),
    };
  },
  writeSubmissionPackage: async ({ form, submission, currentUser, folder = 'uploads', convertTo = 'pdf' }) => {
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
        currentUser,
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
      //comment this out when running local storage, otherwise it'll just delete the zip from the folder it's "uploaded" to
      if (PERMANENT_STORAGE !== StorageTypes.LOCAL_STORAGE) {
        await fs.rm(tempPath, { force: true });
      } else {
        //console.log('Local Development, Files not deleted');
      }
    }
  },
};

module.exports = service;
