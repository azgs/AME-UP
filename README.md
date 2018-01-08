# AME-UP
AME-UP interactive web-mapping tool

An online interactive Web-mapping tool that can be used by city and community planners, military personnel, renewable energy developers and other stakeholders to identify potential permitting requirements, cultural and natural resource sensitivities, and opportunities/conflicts between renewable energy development and military facilities.

This README provides general installation instructions and a description of the underlying database tables. Please see the separate file, AZGS_CONFIG.md for specifics about the AZGS installation and administration.

## Table of Contents

+ [High level architecture](#high-level-architecture)
+ [API server installation](#api-server-installation)
+ [App server installation](#app-server-installation)
+ [Geoserver setup](#geoserver-setup) (optional)
+ [Manage layers in PostgreSQL](#manage-layers-in-postgresql)

## High level architecture
There are three components to AMEUP:
1.	The database: A postgreSQL db that contains the data for users and layers.
2.	The API server: Serves the API. Accesses the database. Node.js/Express
3.	The application (app) server: Serves the web application. Node.js/Express/AngularJS

In addition to these, there will likely be a GeoServer and associated backing db. This is not required (layers are not required to be hosted locally), but we use it in our installation at AZGS.

## API server installation
1.	Download from https://github.com/azgs/AME-UP_Server
2.	Ideally, run bin/ameup-db.sql in a pgAdmin SQL window attached to your db. This might work...
3.	Run `npm install`
4.	Run `npm run-script decrypt`. Enter password when prompted.
5.	Edit resulting file config/config.json as appropriate to installation.

| Config Parameter        | Description |
| ------------- |-------------|
"wfsURL": | The url of the primary wfs server for the ameup installation.
"postgresConnect": | The connect string for the postgres databases backing the ameup installation.
"passportSecret":  | The secret for the auth tokens managed by passport. 
"ameupWFSCredHeader": | The user and password for the primary wfs server. This string is included in an  X-Credentials http header sent with each wfs call. 
"emailFromAddress": | The address to appear in the from parameter of emails sent by ameup. 
"useTLS": | Boolean indicating whether to use TLS or not (certs must be present). 
"ignoreCertErrors": | Allows use of production cert in test environment by ignoring cert host inconsistency. 
"TLSPort": | The port to use for HTTPS. 
"nonTLSPort": | The port to use for HTTP. 
"registrationNotifyEmailAddress": | Email address to send notifications to when new users register. 
"emailTransport": | Nested json object that defines the parameters for the smtp server used by nodemailer. 

6.	If using HTTPS (TLS), create a directory called "cert". In that directory, key and cert files must be placed with these names:
	  `ameup_private.key`
    `ameup_usgin_org_cert.cer`
	  `ameup_usgin_org_interm.cer`
    
7.	Run `npm start`. Did it work? Let's assume so...
8.	For production, stop the server (ctl-c a couple times). Run `npm run-script install-windows-service`. Bring up Windows Services dialog and start the service called ameup-rest

## App server installation
1.	Download from https://github.com/azgs/AME-UP
2.	Edit server.config.json.

| Config Parameter        | Description |
| ------------- |-------------|
"useTLS": | Boolean indicating whether to use HTTPS or not (certs must be present).
"ignoreCertErrors": | Allows use of production cert in test environment by ignoring cert host inconsistency.
"TLSPort": | The port to use for HTTPS.
"nonTLSPort": | The port to use for HTTP:

3.	Edit app/app.conig.js. The only stuff to edit is:

| Config Parameter        | Description |
| ------------- |-------------|
"layersAPI:" | The URL of the API server (prepend "/proxy/" so it goes through the local proxy, to avoid CORS errors). 
"initialLat:" | Initial latitude of map center. (34.275306)
"initialLon:" | Initial longitude of map center. (-111.660222)
"initialZoom:" | Initial zoom level. (7)
"center:" | Use same values as above (don't ask).

````
{ 
  lat: 34.275306,
  lon: -111.660222,
  zoom: 7
}
````    

4.	run `npm start` (npm install and bower install will run automatically). Did it work? Let's assume so...
5.	For production, stop the server (ctl-c a couple times). Run `npm run-script install-windows-service`. Bring up Windows Services dialog and start the service called AME-UP.

## Geoserver setup	
Most of the layers included in AME-UP at AZGS are hosted in a local Geoserver installation. General GeoServer setup is beyond the scope of this document. But here are some particulars of the AZGS installation that may serve as a guide:

+	This GeoServer is running in a Tomcat container. 
+	This Tomcat is installed as a Windows service.
+	It listens on ports 8080 (HTTP) and 5443 (HTTPS). HTTP requests are automatically redirected to the HTTPS port. 
+	HTTPS uses the same certificate used by the other AME-UP servers, converted to PKCS12 and imported into the Tomcat keystore (http://tomcat.apache.org/tomcat-8.5-doc/ssl-howto.html). 
+	A filter chain requires Credentials from Request Headers for all WFS requests.

## Manage layers in PostgreSQL
### To add a layer
1.	Add record to layers table. 
2.	Add necessary records to layer_parameters table.
3.	Add a record to the roles_layers_link table for every role that should have access to this layer.	

### To add a layer_group
1.	Add a record to the layer_groups table.
2.	Add a record to the roles_layer_groups_link table for every role that should have access to this layer group.

### New user registration
1.	Designated administrator will receive an email when a new user registers.
2.	Find the record matching the data in the email in the users table.
3.	In that record, set the approved column to TRUE
4.	Notify user (presumably via email)

### Report text
Intro/outro text for the various can be changed via the report_text table. The ordinal column specifies intro (1) and outro (2).

### Project types and attributes
Project types are defined in the project_types enum. New types can be added with 

````SQL
CREATE TYPE project_types AS ENUM ('type1','type2') -- new group of types
ALTER TYPE project_types ADD VALUE <value> -- add additional type
````

Project type attributes are specified in the project_type_attributes table. The caption column in this table is what is displayed to the user. 

The input_type column can be: numeric, text, text[], or a regular expression prefaced by "regex"
