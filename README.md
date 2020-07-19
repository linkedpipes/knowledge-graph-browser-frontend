# Knowledge Graph Visual Browser

## Installation

### Configuration
To configure the application create a `conf.yaml` file which overwrites the settings from `conf.default.yaml`.

### Build
- run `npm install` to install all dependencies
- run `npm run build` to compile the project
- all build files (including `index.html`) are in `dist/` directory (set this directory as Apache's DocumentRoot)

## URL parameters
You can force app to load graph from a file, specific configuration or metaconfiguration by opening the app with one of the following GET
parameters:

- `?load=<URL-to-file>` Loads file from URL and opens it immediately
- `?meta-configuration=<meta-configuration-IRI>` Loads specific meta configuration instead of the default
- `?configuration=<configuration-IRI>` Skips configuration selection and loads the specified one
