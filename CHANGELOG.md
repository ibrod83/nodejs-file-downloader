## 4.13.0 07/06/2024

### Added
- Added named export for Downloader class

## 4.12.2 29/05/2024

### Fixed
- Fixed vulnerabilities
- Fixed file path handling

### Added
- Added export to TS types

## 4.12.0 23/05/2023

### Added
- Added "method" option to config

## 4.11.1 16/04/2023

### Fixed
- Fixed tempPath scope in removeFailedFile call


## 4.11.0 02/04/2023

### Added
- Added support for Data URI

## 4.10.6 07/01/2023

### Added
- Added ko-fi link

## 4.10.5 07/01/2023

### Fixed
- Fixed vulnerabilities

### Changed
- Changed CI tests to node versions 16,18

## 4.10.3 16/12/2022

### Fixed
- Fixed a typo in Downloader.td.ts

## 4.10.2 28/08/2022

### Fixed
- Updated follow-redirects. Timeout during stream bug in follow-redirects creates a socket hangup instead of a timeout event. Adapted timeout tests to be consistent with this behavior. Fails in node 12.

## 4.10.0 19/07/2022

### Fixed
- Fixed two vulnerabilities

### Added
- Downloader.download() now resolves with an object, currently containing two properties: "filePath"(string|null) and "downloadStatus"('COMPLETE'|'ABORTED').
filePath will be null if the download was interrupted from one of the hooks(In this case, downloadStatus will be "ABORTED").

## 4.9.3 06/02/2022

### Fixed
- Fixed broken httpsAgent property. Added a warning about security issue in follow-redirects.

## 4.9.0 31/12/2021

### Added
- Added a reference to the response body, to the error object(error.responseBody). Original IncomingMessage response stream is still available at error.response, but being that it's already consumed by the time the error is thrown, any existing code relying on streaming this stream manually will fail.

## 4.8.1 10/12/2021

### Added
- Added a User-Agent explanation.

## 4.8.0 05/12/2021

### Added
- Added a reference to the response object, to the Error object.

## 4.7.4 16/09/2021

### Fixed
- Fixed skipExistingFile not working when cloneFiles is true

### Added
- Added documentation of custom headers

## 4.7.3 29/08/2021

### Fixed
- Fixed td export.

## 4.7.2 31/07/2021

### Added
- Added concurrency test.

## 4.7.1 20/06/2021

### Fixed
- Fixed type definitions.


## 4.7.0 17/06/2021

### Feature
- Added type definition file.
- Replaced config.cloneFiles = 'skip' with a new property, config.skipExistingFileName
## 4.6.0 10/06/2021

### Feature
- Added the ability to skip downloads if the same file name exists.

## 4.5.3 09/05/2021

### Fixed
- Improved cancellation and timeout handling, by encapsulating all request and error handling inside an async iterator.
No changes to the API.
- Fixed lodash vulnerability
