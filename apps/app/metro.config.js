// Metro for a pnpm monorepo + NativeWind.
// Watch the workspace root so @habit/* source changes hot reload.
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// @habit/* packages are TypeScript source using Node ESM specifiers
// (`./types.js` meaning `./types.ts`). Metro resolves literally, so retry
// those imports without the extension.
const packagesRoot = path.resolve(workspaceRoot, 'packages');
const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    moduleName.startsWith('.') &&
    moduleName.endsWith('.js') &&
    context.originModulePath.startsWith(packagesRoot)
  ) {
    return context.resolveRequest(context, moduleName.slice(0, -3), platform);
  }
  return defaultResolveRequest
    ? defaultResolveRequest(context, moduleName, platform)
    : context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: './global.css' });
