const fs = require('fs');
const Problem = require('api-problem');

const clamAvScanner = require('../../../components/clamAvScanner');
const log = require('../../../components/log')(module.filename);

module.exports.virusScan = async (req, res, next) => {
  // is there a file to scan?
  if (req.file) {
    const scanResult = await clamAvScanner.scanFile(req.file.path);
    log.info(`${req.file.originalname} scanned. is infected? ${scanResult.isInfected} ${scanResult.viruses}`);
    if (scanResult.isInfected) {
      try {
        // Delete the infected file
        fs.unlinkSync(req.file.path);
      } catch (e) {
        log.error(`Could not delete infected file: ${req.file.path}. ${e.message}`);
      }
      return next(
        // using 409 because there is no standard but there is this...
        //https://learn.microsoft.com/en-us/openspecs/sharepoint_protocols/ms-wsshp/1c302d04-b76f-44e9-800d-c974250de84d
        new Problem(409, {
          detail: `Uploaded file (${req.file.originalname}) contains malware: ${scanResult.viruses}`,
          viruses: scanResult.viruses,
        })
      );
    }
  }
  next();
};
