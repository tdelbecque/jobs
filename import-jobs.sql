drop table if exists jobs;

create table jobs (
   jobid     varchar,
   location  varchar,
   nbFlattenSectors	smallint,
   flattenSectors	varchar,
   title		varchar,
   description		varchar,
   latitude		real,
   longitude		real,
   applyUrl		varchar,
   posted		varchar,
   expiryDate		varchar,
   expirityTile		bigint
);

copy jobs from '/home/thierry/work/jobs/jobs-snapshot-info.csv' with CSV delimiter E'\t' quote E'\b';

drop table if exists jobshc;

create table jobshc (
       jobid varchar,
       catcode	CHAR(4)
);

copy jobshc from '/home/thierry/work/jobs/jobs-snapshot-hc.csv' with CSV delimiter E'\t' quote E'\b';

drop table if exists jobsectors;

create table jobsectors (
       jobid varchar,
       sector	varchar,
       level	char(1)
);

copy jobsectors from '/home/thierry/work/jobs/jobs-snapshot-sectors.csv' with CSV delimiter E'\t' quote E'\b';
