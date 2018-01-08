# AME-UP
AME-UP interactive web-mapping tool

An online interactive Web-mapping tool that can be used by city and community planners, military personnel, renewable energy developers and other stakeholders to identify potential permitting requirements, cultural and natural resource sensitivities, and opportunities/conflicts between renewable energy development and military facilities.

AZGS_CONFIG.md provides general installation instructions and a description of the underlying database tables. Please see the README for general installation instructions.

## Table of Contents

+ [AZGS installation overview](#azgs-installation-overview)
+ [Config for API server](#config-for-api-server)
+ [Config for APP server](#config-for-app-server)
+ [Config for geoserver setup](#config-for-geoserver) (optional)

## AZGS installation overview
Prod and dev systems run on the AZGS server [lindakerite](https://github.com/azgs/development/wiki/Lindackerite-Server). Developer runs local installation on his own machine.

### Prod system
+ database: ameupdb 
+ API Server location on disk: C:\Node\Ameup-server\AME-UP_Server
+ Application server location on disk: C:\Node\Ameup\AME-UP

AME-UP_Server and AME-UP both run as windows services (currently called ameup-rest and AME-UP, respectively) and should autostart when the machine is booted. They are currently logging to files called stdout and stderr in their respective root directories. The prod API server listens on port 3443 (https). The prod app server listens on ports 80 (http) and 443 (https). On the app server, http requests are automatically redirected to https.

### Dev system
+ database: ameupdb-dev
+ API Server location on disk: C:\Node\Ameup-server-dev\AME-UP_Server
+ Application server location on disk: C:\Node\Ameup-dev\AME-UP

This serves as a staging area for changes before they are deployed to the live system. The dev API server listens on port 4430 (https). The dev app server listens on ports 8008 (http) and 4431 (https). On the app server, http requests are automatically redirected to https.
Config for AZGS installation of AMEUP (contains sensitive data):

## Config for API server
| Config Parameter        | Description |
| ------------- |-------------|
Password | (keepass, under ameup_api_server)
postgresConnect: | "postgres://postgres:aimuptime@localhost:5432/ameupdb" (prod)
postgresConnect: | "postgres://postgres:aimuptime@localhost:5432/ameupdb-dev" (dev)
passportSecret: | (keepass, under ameup_passport)
wfsURL: | "https://ameup.usgin.org:5443/geoserver/wfs"
ameupWFSCredHeader: | "private-user=geoconnect&private-pw=[PASSWORD]"  (keepas, under ameup_wfs_pw)
emailFromAddress: | "ameup.admin@usgin.org"
TLSPort: | 3443 (prod)
TLSPort: | 4430 (dev)
nonTLSPort: | 3080 (production; unused)
nonTLSPort: | 3000 (dev)
registrationNotifyEmailAddress: | "ameup.admin@usgin.org"
emailTransport: | (keepass, under ameup_email_trans)

````JSON
{
  "host": "host.usgin.org",
	"port": 465,
	"secure": true,
	"auth": {
	    "user": "ameup.admin@usgin.org", "pass": ["PASSWORD"]
      }
}
````

## Config for APP server
| Config Parameter        | Description |
| ------------- |-------------|
TLSPort: | 443 (prod)
TLSPort: | 4431 (dev)
nonTLSPort: | 80 (prod)
nonTLSPort: | 8008 (dev)
initialLat: | 34.275306
initialLon: | -111.660222
initialZoom: | 7
layersAPI: | '/proxy/https://ameup.usgin.org:3443/api' (prod)
layersAPI: | '/proxy/https://10.208.3.127:4430/api' (dev)

## Config for GeoServer
| Config Parameter        | Description |
| ------------- |-------------|
Keystore password: | (keepass, under ameup_geoserver_keystore)
