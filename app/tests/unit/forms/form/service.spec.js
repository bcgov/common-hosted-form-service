const { NotFoundError } = require('objection');

const { MockModel, MockTransaction } = require('../../../common/dbHelper');

jest.mock('../../../../src/forms/common/models/tables/fileStorage', () => MockModel);
jest.mock('../../../../src/forms/common/models/tables/fileStorageReservation', () => MockModel);
jest.mock('../../../../src/forms/common/models/tables/submissionsExport', () => MockModel);

const service = require('../../../../src/forms/form/service');
const storageService = require('../../../../src/forms/file/storage/storageService');

beforeEach(() => {
  MockModel.mockReset();
  MockTransaction.mockReset();
});

const CURRENT_USER = {
  id: '0',
  usernameIdp: 'test',
};


describe('_findFileIds', () => {
  it('should handle a blank everything', () => {
    const schema = {
      components: []
    };
    const data = {
      submission: {
        data: {},
      },
    };
    const fileIds = service._findFileIds(schema, data);
    expect(fileIds).toEqual([]);
  });

  it('should return an empty array if no file controls', () => {
    const schema = {
      components: [
        {
          type: 'simpletextfield',
          key: 'aTextBox'
        }
      ]
    };
    const data = {
      submission: {
        data: {
          aTextBox: '',
        },
      },
    };
    const fileIds = service._findFileIds(schema, data);
    expect(fileIds).toEqual([]);
  });

  it('should return an empty array if there is a file control with no file in it', () => {
    const schema = {
      components: [
        {
          type: 'simpletextfield',
          key: 'aTextBox'
        },
        {
          type: 'simplefile',
          key: 'theFirstFile'
        }
      ]
    };
    const data = {
      submission: {
        data: {
          aTextBox: '',
          theFirstFile: [
          ],
        },
      },
    };
    const fileIds = service._findFileIds(schema, data);
    expect(fileIds).toEqual([]);
  });

  it('should return an empty array if there are multiple file controls with no files in them', () => {
    const schema = {
      components: [
        {
          type: 'simpletextfield',
          key: 'aTextBox'
        },
        {
          type: 'simplefile',
          key: 'theFirstFile'
        },
        {
          type: 'simpletextfield',
          key: 'bTextBox'
        },
        {
          type: 'simplefile',
          key: 'theSecondFile'
        },
      ]
    };
    const data = {
      submission: {
        data: {
          aTextBox: '',
          theFirstFile: [
          ],
          theSecondFile: [
          ],
        },
      },
    };
    const fileIds = service._findFileIds(schema, data);
    expect(fileIds).toEqual([]);
  });

  it('should return a fileId for a populated file control', () => {
    const schema = {
      components: [
        {
          type: 'simplefile',
          key: 'theFirstFile'
        },
        {
          type: 'simpletextfield',
          key: 'aTextBox'
        }
      ]
    };
    const data = {
      submission: {
        data: {
          aTextBox: '',
          theFirstFile: [
            {
              storage: 'chefs',
              url: '/app/api/v1/files/009c1edc-59f5-462f-bdd1-460aa71b9e22',
              size: 253400,
              data: {
                id: '009c1edc-59f5-462f-bdd1-460aa71b9e22',
              },
              originalName: 'v18.json',
            },
          ],
        },
      },
    };
    const fileIds = service._findFileIds(schema, data);
    expect(fileIds).toEqual(['009c1edc-59f5-462f-bdd1-460aa71b9e22']);
  });

  it('should return a list of fileIds for multiple populated file controls', () => {
    const schema = {
      components: [
        {
          type: 'simplefile',
          key: 'theFirstFile'
        },
        {
          type: 'simpletextfield',
          key: 'aTextBox'
        },
        {
          type: 'simplefile',
          key: 'theSecondFile'
        },
        {
          type: 'simpletextfield',
          key: 'bTextBox'
        },
      ]
    };
    const data = {
      submission: {
        data: {
          aTextBox: '',
          theFirstFile: [
            {
              storage: 'chefs',
              url: '/app/api/v1/files/009c1edc-59f5-462f-bdd1-460aa71b9e22',
              size: 253400,
              data: {
                id: '009c1edc-59f5-462f-bdd1-460aa71b9e22',
              },
              originalName: 'v18.json',
            },
          ],
          bTextBox: 'yes',
          theSecondFile: [
            {
              storage: 'chefs',
              url: '/app/api/v1/files/009c1edc-59f5-462f-bdd1-460aa71b9e22',
              size: 253400,
              data: {
                id: '70daceba-14cf-42c9-8532-9e5717809266',
              },
              originalName: 'something.docx',
            },
          ],
        },
      },
    };
    const fileIds = service._findFileIds(schema, data);
    expect(fileIds).toEqual(['009c1edc-59f5-462f-bdd1-460aa71b9e22', '70daceba-14cf-42c9-8532-9e5717809266']);
  });

  it('should return a blank array for a hidden file control', () => {
    const schema = {
      components: [
        {
          type: 'simplefile',
          key: 'theFirstFile'
        },
        {
          type: 'simpletextfield',
          key: 'aTextBox'
        }
      ]
    };
    const data = {
      submission: {
        data: {
          aTextBox: ''
        }
      },
    };
    const fileIds = service._findFileIds(schema, data);
    expect(fileIds).toEqual([]);
  });


  it('should return a single item array for 1 shown, and 1 hidden file control', () => {
    const schema = {
      components: [
        {
          type: 'simplefile',
          key: 'theFirstFile'
        },
        {
          type: 'simpletextfield',
          key: 'aTextBox'
        },
        {
          type: 'simplefile',
          key: 'theSecondFile'
        },
      ]
    };
    const data = {
      submission: {
        data: {
          aTextBox: '',
          theSecondFile: [
            {
              storage: 'chefs',
              url: '/app/api/v1/files/009c1edc-59f5-462f-bdd1-460aa71b9e22',
              size: 253400,
              data: {
                id: '70daceba-14cf-42c9-8532-9e5717809266',
              },
              originalName: 'something.docx',
            },
          ],
        },
      },
    };
    const fileIds = service._findFileIds(schema, data);
    expect(fileIds).toEqual(['70daceba-14cf-42c9-8532-9e5717809266']);
  });

});

describe('readVersionFields', () => {

  it('should return right number of fields without columns',  async () => {
    const schema = {
      type: 'form',
      components: [
        {
          type: 'textfield',
          input: true,
          key: 'firstName'
        }
      ]
    };

    // mock readVersion function
    service.readVersion = jest.fn().mockReturnValue( { schema } );
    // get fields
    const fields = await service.readVersionFields();
    // test cases
    expect(fields.length).toEqual(1);
  });

  it('should return right number of fields with columns',  async () => {
    const schema = {
      type: 'form',
      components: [
        {
          type: 'textfield',
          input: true,
          key: 'firstName'
        },
        {
          type: 'columns',
          input: false,
          key: 'myColumns',
          columns: [
            {
              size: 'lg',
              components: []
            },
            {
              size: 'lg',
              components: [
                {
                  type: 'textfield',
                  input: true,
                  key: 'lastName'
                },
              ]
            },
            {
              size: 'lg',
              components: []
            }
          ]
        }
      ]
    };

    // mock readVersion function
    service.readVersion = jest.fn().mockReturnValue( { schema } );
    // get fields
    const fields = await service.readVersionFields();
    // test cases
    expect(fields.length).toEqual(2);
  });

});

describe('file_storage_reservation', () => {
  describe('list', () => {
    it('should succeed', async () => {
      const params = {
        fileId: null,
        ready: null,
        createdBy: null,
        older: null,
      };

      await service.listReservation(params);

      expect(MockModel.query).toHaveBeenCalledTimes(1);
      expect(MockModel.query).toHaveBeenCalledWith();
      expect(MockModel.modify).toHaveBeenCalledTimes(4);
      expect(MockModel.modify).toHaveBeenCalledWith('filterFileId', null);
      expect(MockModel.modify).toHaveBeenCalledWith('filterReady', null);
      expect(MockModel.modify).toHaveBeenCalledWith('filterCreatedBy', null);
      expect(MockModel.modify).toHaveBeenCalledWith('filterOlder', null);
    });
  });

  describe('read', () => {
    it('should succeed', async () => {
      await service.readReservation('');

      expect(MockModel.query).toHaveBeenCalledTimes(1);
      expect(MockModel.query).toHaveBeenCalledWith();
      expect(MockModel.findById).toHaveBeenCalledTimes(1);
    });
  });

  describe('create', () => {
    it('should succeed', async () => {
      const data = {
        id: '0',
        createdBy: CURRENT_USER.usernameIdp,
      };

      let mockReadReservation = jest.spyOn(service, 'readReservation');

      mockReadReservation.mockImplementation(() => { return { ...data }; });

      await service.createReservation(CURRENT_USER, data);

      expect(MockModel.startTransaction).toHaveBeenCalledTimes(1);
      expect(MockModel.query).toHaveBeenCalledTimes(1);
      expect(MockModel.query).toHaveBeenCalledWith(MockTransaction);
      expect(MockModel.insert).toHaveBeenCalledTimes(1);
      expect(MockTransaction.commit).toHaveBeenCalledTimes(1);

      mockReadReservation.mockRestore();
    });
  });

  describe('delete', () => {
    it('should succeed', async () => {
      const data = {
        id: '0',
        fileId: '1',
        createdBy: CURRENT_USER.usernameIdp,
      };
      const subsexp = [
        {
          id: '0'
        }
      ];

      let mockReadReservation = jest.spyOn(service, 'readReservation');
      let mockDelete = jest.spyOn(storageService, 'delete');

      mockReadReservation.mockImplementation(() => data);
      mockDelete.mockImplementation(() => {});

      await service.deleteReservation(data.id);

      expect(MockModel.startTransaction).toHaveBeenCalledTimes(1);
      expect(service.readReservation).toHaveBeenCalledTimes(1);
      expect(service.readReservation).toHaveBeenCalledWith(data.id);

      expect(MockModel.query).toHaveBeenCalledTimes(1 + subsexp.length + 1);
      expect(MockModel.query).toHaveBeenCalledWith(MockTransaction);
      expect(MockModel.deleteById).toHaveBeenCalledTimes(1);
      expect(MockTransaction.commit).toHaveBeenCalledTimes(1);

      mockReadReservation.mockRestore();
      mockDelete.mockRestore();
    });

    it('should fail with no existing reservation', async () => {
      const data = {
        id: '0',
        fileId: '1',
        createdBy: CURRENT_USER.usernameIdp,
      };

      let mockReadReservation = jest.spyOn(service, 'readReservation');
      let mockDelete = jest.spyOn(storageService, 'delete');

      mockReadReservation.mockImplementation(() => { throw new NotFoundError(); });
      mockDelete.mockImplementation(() => {});

      const fn = () => service.deleteReservation(data.id);

      await expect(fn()).rejects.toThrow();
      expect(MockModel.startTransaction).toHaveBeenCalledTimes(1);
      expect(service.readReservation).toHaveBeenCalledTimes(1);
      expect(MockTransaction.rollback).toHaveBeenCalledTimes(1);

      mockReadReservation.mockRestore();
      mockDelete.mockRestore();
    });
  });
});
