exports.up = function (knex) {
  return Promise.resolve()
    .then(() => knex.schema.dropViewIfExists('external_api_vw'))
    .then(() =>
      knex.schema.raw(`create or replace view external_api_vw as 
        select e.id, e."formId", f.ministry, f.name as "formName", e.name, e."endpointUrl",
              e.code, easc.display, e."allowSendUserToken", e."sendApiKey" from external_api e 
        inner join external_api_status_code easc on e.code = easc.code 
        inner join form f on e."formId" = f.id 
        order by f.ministry, "formName", e.name;`)
    );
};

exports.down = function (knex) {
  return Promise.resolve()
    .then(() => knex.schema.dropViewIfExists('external_api_vw'))
    .then(() =>
      knex.schema.raw(
        `create or replace view external_api_vw as 
        select e.id, e."formId", f.ministry, f.name as "formName", e.name, e."endpointUrl",
              e.code, easc.display, e."allowSendUserToken" from external_api e 
        inner join external_api_status_code easc on e.code = easc.code 
        inner join form f on e."formId" = f.id 
        order by f.ministry, "formName", e.name;`
      )
    );
};
