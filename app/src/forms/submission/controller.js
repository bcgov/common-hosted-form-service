const { Statuses } = require('../common/constants');
const cdogsService = require('../../components/cdogsService');
const emailService = require('../email/emailService');
const service = require('./service');
const PDFDocument = require('pdfkit');
var counter = require('counter');


module.exports = {
  read: async (req, res, next) => {
    try {
      const response = await service.read(req.params.formSubmissionId);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  update: async (req, res, next) => {
    try {
      const response = await service.update(req.params.formSubmissionId, req.body, req.currentUser, req.headers.referer);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  delete: async (req, res, next) => {
    try {
      const response = await service.delete(req.params.formSubmissionId, req.currentUser);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  restore: async (req, res, next) => {
    try {
      const response = await service.restore(req.params.formSubmissionId, req.body, req.currentUser);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  readOptions: async (req, res, next) => {
    try {
      const response = await service.readOptions(req.params.formSubmissionId);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  getNotes: async (req, res, next) => {
    try {
      const response = await service.getNotes(req.params.formSubmissionId);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  addNote: async (req, res, next) => {
    try {
      const response = await service.addNote(req.params.formSubmissionId, req.body, req.currentUser);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  getStatus: async (req, res, next) => {
    try {
      const response = await service.getStatus(req.params.formSubmissionId);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  addStatus: async (req, res, next) => {
    try {
      const tasks = [
        service.changeStatusState(req.params.formSubmissionId, req.body, req.currentUser),
        service.read(req.params.formSubmissionId)
      ];
      const [response, submission] = await Promise.all(tasks);
      // send an email (async in the background)
      if (req.body.code === Statuses.ASSIGNED && req.body.assignmentNotificationEmail) {
        emailService.statusAssigned(submission.form.id, response[0], req.body.assignmentNotificationEmail, req.body.revisionNotificationEmailContent, req.headers.referer).catch(() => { });
      } else if (req.body.code === Statuses.COMPLETED && req.body.submissionUserEmail) {
        emailService.statusCompleted(submission.form.id, response[0], req.body.submissionUserEmail, req.body.revisionNotificationEmailContent, req.headers.referer).catch(() => { });
      } else if (req.body.code === Statuses.REVISING && req.body.submissionUserEmail) {
        emailService.statusRevising(submission.form.id, response[0], req.body.submissionUserEmail, req.body.revisionNotificationEmailContent, req.headers.referer).catch(() => { });
      }
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  email: async (req, res, next) => {
    try {
      const submission = await service.read(req.params.formSubmissionId);
      const response = await emailService.submissionConfirmation(submission.form.id, req.params.formSubmissionId, req.body, req.headers.referer);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  templateUploadAndRender: async (req, res, next) => {
    try {
      const submission = await service.read(req.params.formSubmissionId);
      const templateBody = { ...req.body, data: submission.submission.submission.data };
      const { data, headers, status } = await cdogsService.templateUploadAndRender(templateBody);
      const contentDisposition = headers['content-disposition'];

      res.status(status).set({
        'Content-Disposition': contentDisposition ? contentDisposition : 'attachment',
        'Content-Type': headers['content-type']
      }).send(data);
    } catch (error) {
      next(error);
    }
  },
  listEdits: async (req, res, next) => {
    try {
      const response = await service.listEdits(req.params.formSubmissionId);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },

  genSubmissionToPdf: async (req, res, next) => {
    try {

      const submission = await service.read(req.params.formSubmissionId);
      const data = await service.genSubmissionToPdf(submission.submission.submission.data);
      const doc = new PDFDocument({size: 'A4', bufferPages: true, autoFirstPage: false});
      doc.addPage();
      let count = counter(0);
      let height =0;

      for (let val of data){
        count.value+=1;
        height = (count.value)*30 ;

        if(height>710) {
          count = counter(0);
          doc.addPage();
          count.value+=1;
          height = (count.value)*30;
        }

        if(typeof val[0] === 'string'){
          doc.fontSize(20)
            .font('Courier-Bold').text(val[0], (val[1]*10)+10, height);
        }
        else if (typeof val === 'object') {
          doc.fontSize(18).font('Courier').text(''+Object.keys(val[0])+' : '+ Object.values(val[0]), (val[1]*10)+10, height);
        }
      }
      doc.pipe(res)
        .on('finish', function () {
        });
      doc.end();
      res.status(200);

    } catch (error) {
      next(error);
    }
  },

};
