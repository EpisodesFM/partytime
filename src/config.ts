const environment = process.env.NODE_ENV ?? "development";
const defaultLevel = new Map([
  ["development", "info"],
  ["production", "warn"],
  ["test", "silent"],
]);

export default {
  logLevel: process.env.LOG ?? defaultLevel.get(environment) ?? "warn",
  environment,
};
