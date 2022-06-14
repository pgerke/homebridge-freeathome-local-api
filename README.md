# homebridge-freeathome-local-api

A Homebridge plugin that allows the user to control BUSCH-JAEGER free@home devices using the System Access Point local API.

![CI](https://img.shields.io/github/workflow/status/pgerke/homebridge-freeathome-local-api/Continuous%20Integration?style=flat-square)
[![codecov](https://codecov.io/gh/pgerke/homebridge-freeathome-local-api/branch/main/graph/badge.svg?token=UJQVXZ5PPM)](https://codecov.io/gh/pgerke/homebridge-freeathome-local-api)
![Dependencies](https://img.shields.io/librariesio/release/npm/homebridge-freeathome-local-api?style=flat-square)
![npm](https://img.shields.io/npm/v/homebridge-freeathome-local-api?style=flat-square)
![License](https://img.shields.io/github/license/pgerke/homebridge-freeathome-local-api?style=flat-square)

## Features

- Control your BUSCH-JAEGER free@home lights, outlets, heating regulartors and more with your Apple devices
- Ask Siri to control your devices and set automations with Apple Home
- Based on the local API provided by the System Access Point running firmware version >2.6.0
- 100% covered by automated unit tests

# Supported accessories

- Binary Sensors
- Outlets
- Lights

That's not that much yet, but keep your eyes peeled, new accessories are coming up soon:

- Dimmable Lights
- Thermostats

I'll add further accessories over time, but feel free to request your favorite accessory type in a [GitHub issue](https://github.com/pgerke/homebridge-freeathome-local-api/issues).

## Requirements

- free@home Access Point running firmware version >2.6.0
- Access to an user account that has access to the local API

## Changelog

The changelog can be viewed [here](CHANGELOG.md).

## I found a bug, what do I do?

I'm happy to hear any feedback regarding the plugin or it's implementation, be it critizism, praise or rants. Please create a [GitHub issue](https://github.com/pgerke/homebridge-freeathome-local-api/issues) or drop me an [email](mailto:info@philipgerke.com) if you would like to contact me.

I would especially appreciate, if you could report any issues you encounter while using the library. Issues I know about, I can probably fix.

If you want to submit a bug report, please check if the issue you have has already been reported. If you want to contribute additional information to the issue, please add it to the existing issue instead of creating another one. Duplicate issues will take time from bugfixing and thus delay a fix.

While creating a bug report, please make it easy for me to fix it by giving us all the details you have about the issue. Always include the version of the library and a short concise description of the issue. Besides that, there are a few other pieces of information that help tracking down bugs:

- The system environment in which the issue occurred (e.g. node version)
- Some steps to reproduce the issue, e.g. a code snippet
- The expected behaviour and how the failed failed to meet that expectation
- Anything else you think I might need

## I have a feature request, what do I do?

Please create a [GitHub issue](https://github.com/pgerke/homebridge-freeathome-local-apihomebridge-freeathome-local-api/issues) or drop me an [email](mailto:info@philipgerke.com)!

## Non-Affiliation Disclaimer

This plugin is not endorsed by, directly affiliated with, maintained, authorized, or sponsored by Busch-Jaeger Elektro GmbH or ABB Asea Brown Boveri Ltd or . All product and company names are the registered trademarks of their original owners. The use of any trade name or trademark is for identification and reference purposes only and does not imply any association with the trademark holder of their product brand.

## License

The project is subject to the MIT license unless otherwise noted. A copy can be found in the root directory of the project [LICENSE](./LICENSE).

<hr>

Made with ❤️ by [Philip Gerke](https://github.com/pgerke)
