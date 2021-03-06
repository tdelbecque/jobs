drop table if exists c5;

create table c5 (
       Title		char(4),
       FirstName	varchar,
       LastName		varchar,
       email		varchar,
       Role		varchar,
       JobTitle		varchar,
       Organization	varchar,
       OrgType		varchar,
       CountryCode	varchar,
       Owner		char(3),
       CapriId		varchar,
       SISIS		varchar,
       CRM_BUS_DIV	varchar,
       CRM_SALES_DIV	varchar,
       CRM_ACCOUNT_ORG_TYPE	varchar,
       CRM_ACCOUNT_NAME		varchar,
       CRM_CONTACT_TYPE		varchar,
       CRM_CONTACT_TITLE	varchar,
       CRM_CONTACT_FNAME	varchar,
       CRM_CONTACT_LNAME	varchar,
       CRM_CONTACT_EMAIL	varchar,
       CRM_CONTACT_PHONE	varchar,
       LANGUAGE			varchar,
       FLEX1			varchar,
       J1_TITLE			varchar,
       J1_LOCATION		varchar,
       J1_URL			varchar,
       J1_DESCRIPTION		varchar,
       J2_TITLE			varchar,
       J2_LOCATION		varchar,
       J2_URL			varchar,
       J2_DESCRIPTION		varchar,
       J3_TITLE			varchar,
       J3_LOCATION		varchar,
       J3_URL			varchar,
       J3_DESCRIPTION		varchar,
       FLEX14			varchar,
       FLEX15			varchar,
       LL_FIRSTNAME		varchar,
       LL_LASTNAME		varchar,		
       LL_ORGANISATION		varchar,
       variant			char(1)
);

--COPY campaigns FROM '/home/thierry/work/M_campaignlist-20160120110054.csv' WITH CSV DELIMITER ',' QUOTE '"' HEADER;

--select jobid, j1_url from jobs, campaigns where jobs.jobid = SUBSTRING (j1_url, '\d+') limit 10;
