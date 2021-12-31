

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
