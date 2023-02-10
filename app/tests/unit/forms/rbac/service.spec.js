const { MockModel, MockTransaction } = require('../../../common/dbHelper');

jest.mock('../../../../src/forms/common/models/tables/FormRoleUser', () => MockModel);

const service = require('../../../../src/forms/rbac/service');

const formId = '4d33f4cb-0b72-4c3d-9e41-f2651805fee1';
const userId = 'cc8c64b7-a457-456e-ade0-09ff7ee75a2b';
const userId2 = 'cc8c64b7-a457-456e-ade0-09ff7ee75a2c';

const Roles = {
  OWNER: 'owner',
  TEAM_MANAGER: 'team_manager',
  FORM_DESIGNER: 'form_designer',
  SUBMISSION_REVIEWER: 'submission_reviewer',
  FORM_SUBMITTER: 'form_submitter'
};

beforeEach(() => {
  MockModel.mockReset();
  MockTransaction.mockReset();
});

describe('setUserForms', () => {
  describe('as a team manager and not an owner', () => {
    describe('the user being updated is your own', () => {
      it ('falls through if you\'re trying to remove your own team manager role', async () => {
        MockModel.modify = () => {
          return [
            {
              id: '1',
              role: Roles.TEAM_MANAGER,
              formId: formId,
              userId: userId,
              createdBy: '',
              createdAt: '',
              updatedBy: '',
              updatedAt: '',
            },
            {
              id: '2',
              role: Roles.FORM_DESIGNER,
              formId: formId,
              userId: userId,
              createdBy: '',
              createdAt: '',
              updatedBy: '',
              updatedAt: '',
            }
          ];
        };
        const currentUser = {
          id: userId,
          forms: [
            {
              id: formId,
              roles: [
                Roles.TEAM_MANAGER,
                Roles.FORM_DESIGNER,
              ]
            }
          ]
        };
        const data = [{
          userId: currentUser.id,
          formId: formId,
          role: Roles.FORM_DESIGNER
        }];

        await expect(service.setUserForms(currentUser.id, formId, data, currentUser)).rejects.toThrow('You can\'t remove your own team manager role.');
      });
    });
    describe('the user being updated is not your own', () => {
      describe('is an owner', () => {
        it('falls through if trying to make any role changes', async () => {
          MockModel.modify = () => {
            return [
              {
                id: '1',
                role: Roles.OWNER,
                formId: formId,
                userId: userId2,
                createdBy: '',
                createdAt: '',
                updatedBy: '',
                updatedAt: '',
              },
              {
                id: '2',
                role: Roles.FORM_DESIGNER,
                formId: formId,
                userId: userId2,
                createdBy: '',
                createdAt: '',
                updatedBy: '',
                updatedAt: '',
              },
              {
                id: '3',
                role: Roles.SUBMISSION_REVIEWER,
                formId: formId,
                userId: userId2,
                createdBy: '',
                createdAt: '',
                updatedBy: '',
                updatedAt: '',
              }
            ];
          };
          const currentUser = {
            id: userId,
            forms: [
              {
                id: formId,
                roles: [
                  Roles.TEAM_MANAGER,
                ]
              }
            ]
          };
          const data = [{
            userId: userId2,
            formId: formId,
            role: Roles.SUBMISSION_REVIEWER
          }, {
            userId: userId2,
            formId: formId,
            role: Roles.FORM_SUBMITTER
          }];
          await expect(service.setUserForms(userId2, formId, data, currentUser)).rejects.toThrow('You can\'t update an owner\'s roles.');
        });
      });
      describe('is not an owner', () => {
        beforeEach(() => {
          MockModel.mockReset();
        });
        it ('falls through when you try to give a designer role', async () => {
          MockModel.modify = () => {
            return [
              {
                id: '1',
                role: Roles.FORM_SUBMITTER,
                formId: formId,
                userId: userId2,
                createdBy: '',
                createdAt: '',
                updatedBy: '',
                updatedAt: '',
              },
              {
                id: '3',
                role: Roles.SUBMISSION_REVIEWER,
                formId: formId,
                userId: userId2,
                createdBy: '',
                createdAt: '',
                updatedBy: '',
                updatedAt: '',
              }
            ];
          };
          const currentUser = {
            id: userId,
            forms: [
              {
                id: formId,
                roles: [
                  Roles.TEAM_MANAGER,
                ]
              }
            ]
          };
          const data = [{
            userId: userId2,
            formId: formId,
            role: Roles.FORM_DESIGNER
          }, {
            userId: userId2,
            formId: formId,
            role: Roles.FORM_SUBMITTER
          }];
          await expect(service.setUserForms(userId2, formId, data, currentUser)).rejects.toThrow('You can\'t add a form designer role.');
        });
        it ('falls through when you try to remove their designer role', async () => {
          MockModel.modify = () => {
            return [
              {
                id: '1',
                role: Roles.FORM_SUBMITTER,
                formId: formId,
                userId: userId2,
                createdBy: '',
                createdAt: '',
                updatedBy: '',
                updatedAt: '',
              },
              {
                id: '2',
                role: Roles.FORM_DESIGNER,
                formId: formId,
                userId: userId2,
                createdBy: '',
                createdAt: '',
                updatedBy: '',
                updatedAt: '',
              },
              {
                id: '3',
                role: Roles.SUBMISSION_REVIEWER,
                formId: formId,
                userId: userId2,
                createdBy: '',
                createdAt: '',
                updatedBy: '',
                updatedAt: '',
              }
            ];
          };
          const currentUser = {
            id: userId,
            forms: [
              {
                id: formId,
                roles: [
                  Roles.TEAM_MANAGER,
                ]
              }
            ]
          };
          const data = [{
            userId: userId2,
            formId: formId,
            role: Roles.SUBMISSION_REVIEWER
          }, {
            userId: userId2,
            formId: formId,
            role: Roles.FORM_SUBMITTER
          }];
          await expect(service.setUserForms(userId2, formId, data, currentUser)).rejects.toThrow('You can\'t remove a form designer role.');
        });

        it ('should succeed when adding manager/reviewer/submitter roles', async () => {
          MockModel.modify = () => {
            return [
            ];
          };
          const currentUser = {
            id: userId,
            forms: [
              {
                id: formId,
                roles: [
                  Roles.TEAM_MANAGER,
                ]
              }
            ]
          };
          const data = [{
            userId: userId2,
            formId: formId,
            role: Roles.TEAM_MANAGER
          }, {
            userId: userId2,
            formId: formId,
            role: Roles.SUBMISSION_REVIEWER
          }, {
            userId: userId2,
            formId: formId,
            role: Roles.FORM_SUBMITTER
          }];
          service.getUserForms = jest.fn().mockReturnValue([]);
          await service.setUserForms(userId2, formId, data, currentUser);
          expect(MockModel.query).toHaveBeenCalledTimes(3);
        });

        it ('should succeed when removing manager/reviewer/submitter roles', async () => {
          MockModel.modify = () => {
            return [
              {
                id: '1',
                role: Roles.FORM_SUBMITTER,
                formId: formId,
                userId: userId2,
                createdBy: '',
                createdAt: '',
                updatedBy: '',
                updatedAt: '',
              },
              {
                id: '2',
                role: Roles.TEAM_MANAGER,
                formId: formId,
                userId: userId2,
                createdBy: '',
                createdAt: '',
                updatedBy: '',
                updatedAt: '',
              },
              {
                id: '3',
                role: Roles.SUBMISSION_REVIEWER,
                formId: formId,
                userId: userId2,
                createdBy: '',
                createdAt: '',
                updatedBy: '',
                updatedAt: '',
              }
            ];
          };
          const currentUser = {
            id: userId,
            forms: [
              {
                id: formId,
                roles: [
                  Roles.TEAM_MANAGER,
                ]
              }
            ]
          };
          const data = [];
          service.getUserForms = jest.fn().mockReturnValue([]);
          await service.setUserForms(userId2, formId, data, currentUser);
          expect(MockModel.query).toHaveBeenCalledTimes(2);
        });
      });
    });
  });
});
