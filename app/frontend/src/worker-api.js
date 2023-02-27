import Worker from 'worker-loader!./worker.js';
import * as Comlink from 'comlink';

const worker = Comlink.wrap(new Worker());

export const submissionExportaStatus = worker.submissionExportaStatus;
export const submissionExport = worker.submissionExport;
