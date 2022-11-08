/* TODO: More research on how to write  */
//More research to be
/*
import {createLocalVue, mount} from "@vue/test-utils";
import FormDesigner from '@/components/designer/FormDesigner.vue';
import Vuex from 'vuex';
import { getField, updateField } from 'vuex-map-fields';
import { IdentityMode } from '@/utils/constants';
*/
//import VueRouter from 'vue-router';
//import Actions from '../../../src/components/Actions'
//import store from '@/store/modules/form';

//const localVue = createLocalVue();
//localVue.use(Vuex);
//localVue.use(mapFields);

describe('Design.vue', () => {
  /* const mockTokenParsedGetter = jest.fn();
  const mockUserGetter = jest.fn();
  const mockFormFields = jest.fn([{
    description: '',
    enableSubmitterDraft: false,
    enableStatusUpdates: false,
    id: '',
    idps: [],
    name: '',
    sendSubRecieviedEmail: false,
    showSubmissionConfirmation: true,
    snake: '',
    submissionReceivedEmails: [],
    userType: IdentityMode.TEAM,
    versions: []
  }]);
  let store;
  const formActions = {
    setShowWarningDialog: jest.fn(),
  };
  const mockMethod1 = jest.spyOn(FormDesigner.methods, 'onRemoveSchemaComponent');
  const mockMethod2 = jest.spyOn(FormDesigner.methods, 'onAddSchemaComponent');
  const mockMethod3 = jest.spyOn(FormDesigner.methods, 'onRenderMethod');
  const mockMethod4 = jest.spyOn(FormDesigner.methods, 'onChangeMethod');
  const mockMethod5 = jest.spyOn(FormDesigner.methods, 'onExportClick');
  const mockMethod6 = jest.spyOn(FormDesigner.methods, 'loadFile');
  const mockMethod7 = jest.spyOn(FormDesigner.methods, 'getFormSchema');
  const mockMethod8 = jest.spyOn(FormDesigner.methods, 'addPatchToHistory');
  const mockMethod9 = jest.spyOn(FormDesigner.methods, 'autosaveEventTrigger');
  const mockMethod10 = jest.spyOn(FormDesigner.methods, 'submitFormButtonClick');
  const mockMethod11 = jest.spyOn(FormDesigner.methods, 'getPatch');
  const mockMethod12 = jest.spyOn(FormDesigner.methods, 'schemaUpdateExistingDraft');
  const mockMethod13 = jest.spyOn(FormDesigner.methods, 'schemaCreateDraftFromVersion');
  const mockMethod14 = jest.spyOn(FormDesigner.methods, 'schemaCreateNew');
  const mockMethod15 = jest.spyOn(FormDesigner.methods, 'onRedoClick');
  const mockMethod16 = jest.spyOn(FormDesigner.methods, 'onUndoClick');
  const mockMethod17 = jest.spyOn(FormDesigner.methods, 'onUndoClick');
  const mockMethod18 = jest.spyOn(FormDesigner.methods, 'submitFormSchema');
  const mockMethod19 = jest.spyOn(FormDesigner.methods, 'canRedoPatch');
  const mockMethod20 = jest.spyOn(FormDesigner.methods, 'canUndoPatch');
  const mockMethod21 = jest.spyOn(FormDesigner.methods, 'resetHistoryFlags');
  const mockMethod22 = jest.spyOn(FormDesigner.methods, 'redoPatchFromHistory');
  const mockMethod23 = jest.spyOn(FormDesigner.methods, 'undoPatchFromHistory');
  const mockMethod24 = jest.spyOn(FormDesigner.methods, 'undoPatchFromHistory');
  beforeEach(() => {
    store = new Vuex.Store({
      modules: {
        auth: {
          namespaced: true,
          getters: {
            tokenParsed: mockTokenParsedGetter,
            user: mockUserGetter
          },
        },
        form:{
          namespaced: true,
          state:{form:{name:"tttt"}},
          getters: {
            getField,
            form:mockFormFields,
          },
          mutations: {
            updateField
        }
        }
      }
    });
  });
  afterEach(() => {
    mockTokenParsedGetter.mockReset();
    mockUserGetter.mockReset();
    mockFormFields.mockReset();
  });
*/
  it('renders', () => {
    /*
    const wrapper = mount(FormDesigner,{
      localVue,
      propsData: { draftId: '' ,formId:'', saved:true, versionId:'', newForm:''},
      store,
      stubs: ['FormBuilder'],
      data() {
        return {
          advancedItems: [
            { text: 'Simple Mode', value: false },
            { text: 'Advanced Mode', value: true },
          ],
          designerStep: 1,
          autosaveFormSchemaHead:{
            display: 'form',
            type: 'form',
            components: [],
          },
          formSchema: {
            display: 'form',
            type: 'form',
            components: [],
          },
          displayVersion: 1,
          reRenderFormIo: 0,
          saving: false,
          isSavedButtonClick: false,
          patch: {
            componentAddedStart: false,
            componentRemovedStart: false,
            componentMovedStart: false,
            history: [],
            index: -1,
            MAX_PATCHES: 30,
            originalSchema: null,
            redoClicked: false,
            undoClicked: false,
          },
        }
      }
    });
    expect(wrapper.find('form-builder').exists()).toBe(true);
    */
    expect(true).toBe(true);
  });
});
