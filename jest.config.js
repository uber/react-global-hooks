// @flow
// Sets the environment variables for tests
process.env.JEST_ENV = "node";
process.env.TZ = "Etc/UTC";

module.exports = {
  verbose: true,
  testURL: "http://localhost:3000/",
  collectCoverageFrom: ["modules/*/src/**/*.js", "!**/node_modules/**"],
  testPathIgnorePatterns: ["/node_modules/", "/examples/", "dist-.*"],
};
