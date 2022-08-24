
exports.up = function (knex) {
  return Promise.resolve()
    .then(() => knex.schema.raw(`create or replace view form_vw as
      SELECT DISTINCT ON (lower(f.name::text), fv.version, f.id) f.id,
                                              f.name,
                                              f.active,
                                              f.description,
                                              f.labels,
                                              f."createdAt",
                                              f."createdBy",
                                              f."updatedAt",
                                              f."updatedBy",
                                              fv.id AS "formVersionId",
                                              fv.version,
                                              case when count(fip.code) = 0 then '{}'::varchar[] else array_agg(distinct(fip.code)) end AS "identityProviders",
                                              case when count(ip.idp) = 0 then '{}'::varchar[] else array_agg(distinct(ip.idp)) end AS idps
    FROM form f
            JOIN form_version fv ON f.id = fv."formId"
            LEFT OUTER JOIN form_identity_provider fip ON f.id = fip."formId"
            LEFT OUTER JOIN identity_provider ip ON fip.code::text = ip.code::text
    GROUP BY f.id, f.name, f.active, f.description, f.labels, f."createdAt", f."createdBy", f."updatedAt",
            f."updatedBy", fv.id, fv.version
    ORDER BY lower(f.name::text), fv.version DESC, f.id`));
};

exports.down = function (knex) {
  // Restore original definition of this view from 001-views
  return Promise.resolve()
    .then(() => knex.schema.raw(`create or replace view form_vw as
      SELECT DISTINCT ON ((lower(f.name::text))) f.id,
                                              f.name,
                                              f.active,
                                              f.description,
                                              f.labels,
                                              f."createdAt",
                                              f."createdBy",
                                              f."updatedAt",
                                              f."updatedBy",
                                              fv.id AS "formVersionId",
                                              fv.version,
                                              case when count(fip.code) = 0 then '{}'::varchar[] else array_agg(distinct(fip.code)) end AS "identityProviders",
                                              case when count(ip.idp) = 0 then '{}'::varchar[] else array_agg(distinct(ip.idp)) end AS idps
      FROM form f
            JOIN form_version fv ON f.id = fv."formId"
            LEFT OUTER JOIN form_identity_provider fip ON f.id = fip."formId"
            LEFT OUTER JOIN identity_provider ip ON fip.code::text = ip.code::text
      GROUP BY f.id, f.name, f.active, f.description, f.labels, f."createdAt", f."createdBy", f."updatedAt",
            f."updatedBy", fv.id, fv.version
      ORDER BY (lower(f.name::text)), fv.version DESC`));
};
