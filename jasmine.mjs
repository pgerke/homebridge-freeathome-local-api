import Jasmine from "jasmine";

const jasmine = new Jasmine();
jasmine.loadConfig({
  spec_dir: "test",
  spec_files: ["**/*.spec.ts"],
  helpers: ["test.ts"],
  jsLoader: "import",
  stopSpecOnExpectationFailure: false,
  random: true,
});

jasmine.execute().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
