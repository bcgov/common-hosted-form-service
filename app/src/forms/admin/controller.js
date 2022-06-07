const service = require('./service');
const formService = require('../form/service');
const fileService = require('./fileService');

module.exports = {
  //
  // Forms
  //
  deleteApiKey: async (req, res, next) => {
    try {
      const response = await formService.deleteApiKey(req.params.formId);
      res.status(204).json(response);
    } catch (error) {
      next(error);
    }
  },
  listForms: async (req, res, next) => {
    try {
      const response = await service.listForms(req.query);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  readDraft: async (req, res, next) => {
    try {
      const response = await service.readDraft(req.params.formVersionDraftId);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  readForm: async (req, res, next) => {
    try {
      const response = await service.readForm(req.params.formId);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  readVersion: async (req, res, next) => {
    try {
      const response = await service.readVersion(req.params.formVersionId);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  readApiDetails: async (req, res, next) => {
    try {
      const response = await formService.readApiKey(req.params.formId);
      if (response) {
        delete response.secret;
      }
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  restoreForm:  async (req, res, next) => {
    try {
      const response = await service.restoreForm(req.params.formId);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },

  //
  // Users
  //
  getUsers: async (req, res, next) => {
    try {
      const response = await service.getUsers(req.query);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  getFormUserRoles: async (req, res, next) => {
    try {
      const response = await service.getFormUserRoles(req.params.formId);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },

  //
  // Form Components Help Information
  //
  createFormComponentsHelpInfo:async(req,res,next)=>{
    try{
      const response = await service.createFormComponentsHelpInfo(req.body);
      res.status(200).json(response);
    } catch(error){
      next(error);
    }
  },

  updateFormComponentsHelpInfo:async(req,res,next)=>{
    try{
      const response = await service.updateFormComponentsHelpInfo(req.params);
      res.status(200).json(response);
    } catch(error){
      next(error);
    }
  },
  uploadImage: async(req,res,next)=>{
    try{
      const response = await fileService.create(req.body);
      res.status(200).json(response);
    } catch(error){
      next(error);
    }
  }

};
