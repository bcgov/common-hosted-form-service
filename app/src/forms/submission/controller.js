const { Statuses } = require('../common/constants');
const cdogsService = require('../../components/cdogsService');
const emailService = require('../email/emailService');
const service = require('./service');
const { jsPDF } = require("jspdf");
const doc = new jsPDF();
let index=0;

const controller = {

  reArrangeJSon: (obj, keyPath)=> {
    index = index+1;
    console.log("++---------->>> ", index);
    Object.keys(obj).forEach((key)=>{
      if(obj[key].constructor.name==="Array") {
        for (value of obj[key]){
          controller.reArrangeJSon(value, keyPath+"."+key);
        }
      }
      if(obj[key].constructor.name==="Object") {
        controller.reArrangeJSon(obj[key],keyPath+"."+key);
      }
      else if (obj[key].constructor.name==="String" || obj[key].constructor.name==="Number" || obj[key].constructor.name==="Boolean" ) {
        doc.text(`${keyPath+"."+key}`+":"+obj[key],0, (50+(index)*50));
      }
    })
  },

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
      let index=0;
      //await controller.reArrangeJSon(submission.submission.submission.data, "data",index);

      let flatten = function(data) {
        var result = {};
        function recurse (cur, prop) {
            if (Object(cur) !== cur) {
                result[prop] = cur;
            } else if (Array.isArray(cur)) {
                 for(var i=0, l=cur.length; i<l; i++)
                     recurse(cur[i], prop + "[" + i + "]");
                if (l == 0)
                    result[prop] = [];
            } else {
                var isEmpty = true;
                for (var p in cur) {
                    isEmpty = false;
                    recurse(cur[p], prop ? prop+"."+p : p);
                }
                if (isEmpty && prop)
                    result[prop] = {};
            }
        }
        recurse(data, "");
        return result;
    }
    let b = flatten(submission.submission.submission.data);
      let entries = Object.entries(b);
      const doc = new jsPDF();


      for(let [index, [key, value]] of entries.entries()){
        doc.text(`${key}`+":"+value,0, (5+(index)*5));
      }

     // doc.text(eval(submission.submission.submission.data), 10, 10);

      doc.save("a4.pdf");

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
};

module.exports = controller;
