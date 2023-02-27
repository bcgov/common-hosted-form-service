import * as Comlink from 'comlink';
import { appAxios } from '@/services/interceptors';
import { ApiRoutes } from '@/utils/constants';

const fns = {
  async submissionExportaStatus () {

    let result = await setInterval(()=>{
      //console.log(`${ApiRoutes.FORMS}/${formId}/${version}/export/status`);
      return 2;
      //appAxios().get(`app/api/v1/${ApiRoutes.FORMS}/${formId}/${version}/export/status`);
    }, 8000);
    console.log('I am hereee', result);
    return result;
  },
  async submissionExport (formId, version) {
    return appAxios().get(`app/api/v1/${ApiRoutes.FORMS}/${formId}/${version}/submission/export`,
      {
        responseType: 'blob'
      });
  }

};

Comlink.expose(fns);
