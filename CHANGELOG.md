# Change Log

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 0.2.1-pre - 16.06.2022

### Fixed

- [PG-184](https://pgerke.atlassian.net/browse/PG-184):
  Fixed broken config scheme

## 0.2.0-pre - 16.06.2022

### Added

- [PG-181](https://pgerke.atlassian.net/browse/PG-181):
  Support dimmer actuator
- [PG-182](https://pgerke.atlassian.net/browse/PG-182):
  Support thermostat actuator

### Changed

- [PG-179](https://pgerke.atlassian.net/browse/PG-179):
  Homekit get value requests will now be resolved from a cache instead of requesting the value from the system access point.

### Fixed

- [PG-178](https://pgerke.atlassian.net/browse/PG-178):
  Binary Switch is actually a switch actuator

## 0.1.0-pre - 14.06.2022

### Added

- [PG-144](https://pgerke.atlassian.net/browse/PG-144):
  Initial vertical increment, not published to npmjs.org yet.
- [PG-146](https://pgerke.atlassian.net/browse/PG-146):
  Support binary switch
