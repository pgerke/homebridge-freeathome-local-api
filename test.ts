import { SpecReporter } from "jasmine-spec-reporter";

// Preserve original timeout
export const originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;

// Configure reporters
jasmine.getEnv().clearReporters();
jasmine.getEnv().addReporter(
  new SpecReporter({
    spec: {
      displayDuration: true,
      displayErrorMessages: true,
      displayFailed: true,
      displayPending: true,
      displaySuccessful: true,
    },
  })
);
