import { getField, updateField } from 'vuex-map-fields';

export default {
  namespaced: true,
  state: {
    objectsToLoad: [],
    objectsLoaded: [],
  },
  getters: {
    getField,
    objectsToLoad: state => state.objectsToLoad,
    objectsLoaded: state => state.objectsLoaded,
  },
  mutations: {
    updateField,
    PUSH_OBJECTS_TO_LOAD(state, object) {
      state.objectsToLoad.push(object);
    },
    PUSH_OBJECT_LOADED(state, object) {
      // Remove the object from objects to load
      state.objectsToLoad = state.objectsToLoad.filter(
        objectToLoad => objectToLoad.id !== object.id
      );
      state.objectsLoaded.push(object);
    },
    RESET_OBJECT_LOADER(state) {
      state.objectsToLoad = [];
      state.objectsLoaded = [];
    },
    SET_OBJECTS_TO_LOAD(state, objectsToLoad) {
      state.objectsToLoad = objectsToLoad;
    },
    SET_OBJECTS_LOADED(state, objectsLoaded) {
      state.objectsLoaded = objectsLoaded;
    },
  },
  actions: {
    async loadObject({ commit, dispatch }, object) {
      try {
        commit('PUSH_OBJECTS_TO_LOAD', object);
      } catch (error) {
        dispatch('notifications/addNotification', {
          message: 'An error occurred adding an object to load.',
          consoleError: `Error adding  object to load: ${error}`,
        }, { root: true });
      }
    },
    async loadedObject({ commit, dispatch }, object) {
      try {
        commit('PUSH_OBJECT_LOADED', object);
      } catch (error) {
        dispatch('notifications/addNotification', {
          message: 'An error occurred adding an object to load.',
          consoleError: `Error adding  object to load: ${error}`,
        }, { root: true });
      }
    },
    async setObjectsToLoad({ commit, dispatch }, objectsToLoad) {
      try {
        commit('SET_OBJECTS_TO_LOAD', objectsToLoad);
      } catch (error) {
        dispatch('notifications/addNotification', {
          message: 'An error occurred setting objects to load.',
          consoleError: `Error setting objects to load: ${error}`,
        }, { root: true });
      }
    },
    async setObjectsLoaded({ commit, dispatch }, objectsLoaded) {
      try {
        commit('SET_OBJECTS_LOADED', objectsLoaded);
      } catch (error) {
        dispatch('notifications/addNotification', {
          message: 'An error occurred setting objects loaded.',
          consoleError: `Error setting objects loaded: ${error}`,
        }, { root: true });
      }
    },
    async resetObjectLoader({ commit, dispatch }) {
      try {
        commit('RESET_OBJECT_LOADER');
      } catch (error) {
        dispatch('notifications/addNotification', {
          message: 'An error occurred setting objects loaded.',
          consoleError: `Error setting objects loaded: ${error}`,
        }, { root: true });
      }
    },
  },
};
