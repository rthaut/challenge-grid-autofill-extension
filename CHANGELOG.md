# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Enhancements

- Add custom grids, with your own columns, rows, labels and characters per cell (#10)
- Add a keyboard shortcut (Alt+Shift+G by default) that autofills the current page with your only grid, or the grid you last used on that site (#15)

### Bug Fixes

- Show one notification when a page with frames can't be filled, instead of one per frame
- Fill the page only once when autofilling it again without reloading
- Fill the response so sites built with React and similar frameworks see it, and auto-submit the way clicking the submit button does (#67)
- Size the grid editor to fit the grid, so grids only scroll sideways when the window is too narrow

### Other

- Require Chrome or Edge 117 or later, or Firefox 121 or later
- Update Material UI to version 9

## [2.0.1] - 2026-10-10

### Bug Fixes

- Declare that the extension does not collect any data, as Firefox now expects (#52)

### Other

- Update dependencies, including security fixes
- Update the build tooling to WXT 0.21

## [2.0.0] - 2024-03-20

### Other

- Migrate to Manifest V3

## [1.1.0] - 2021-09-28

### Enhancements

- Reduce permissions needed for content script

### Bug Fixes

- Fix (#4) for missing Roboto font

## [1.0.1] - 2021-09-15

### Bug Fixes

- Fix (#3) for CSV files not importing on some systems (#2)

## [1.0.0] - 2021-09-14

Initial Release

[unreleased]: https://github.com/rthaut/challenge-grid-autofill-extension/compare/v2.0.1...HEAD
[2.0.1]: https://github.com/rthaut/challenge-grid-autofill-extension/compare/v2.0.0...v2.0.1
[2.0.0]: https://github.com/rthaut/challenge-grid-autofill-extension/compare/v1.1.0...v2.0.0
[1.1.0]: https://github.com/rthaut/challenge-grid-autofill-extension/compare/v1.0.1...v1.1.0
[1.0.1]: https://github.com/rthaut/challenge-grid-autofill-extension/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/rthaut/challenge-grid-autofill-extension/commits/v1.0.0
