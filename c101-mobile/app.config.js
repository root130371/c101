const base = require("./app.json").expo;

// Store identifiers belong to the owner's accounts. Do not invent release IDs.
module.exports = () => {
  const androidPackage = process.env.C101_ANDROID_PACKAGE;
  const bundleIdentifier = process.env.C101_IOS_BUNDLE_IDENTIFIER;
  const projectId = process.env.C101_EAS_PROJECT_ID;
  if (process.env.EAS_BUILD_PLATFORM === "android" && !androidPackage) {
    throw new Error("Set C101_ANDROID_PACKAGE to the Google Play package name before building.");
  }
  if (process.env.EAS_BUILD_PLATFORM === "ios" && !bundleIdentifier) {
    throw new Error("Set C101_IOS_BUNDLE_IDENTIFIER before building for iOS.");
  }
  return {
    ...base,
    android: { ...base.android, ...(androidPackage ? { package: androidPackage } : {}) },
    ios: { ...base.ios, ...(bundleIdentifier ? { bundleIdentifier } : {}) },
    ...(projectId ? { extra: { eas: { projectId } } } : {}),
  };
};
