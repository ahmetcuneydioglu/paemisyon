// Expo varsayılan Metro yapılandırması + monorepo token paketi (Doc 49 F1).
//
// `packages/tokens/build/tokens.ts` tek kaynaktan üretilir ve bu uygulama onu doğrudan içe
// aktarır (kopya yok). Metro proje kökü dışını izlemez; token klasörü watchFolders'a eklenir.
const { getDefaultConfig } = require("expo/metro-config");
const path = require("node:path");

const projectRoot = __dirname;
const tokensRoot = path.resolve(projectRoot, "../../packages/tokens");

const config = getDefaultConfig(projectRoot);
config.watchFolders = [...(config.watchFolders ?? []), tokensRoot];
// Token paketinin kendi bağımlılığı yok; çözümleme yalnız bu uygulamanın node_modules'ünden.
config.resolver.nodeModulesPaths = [path.resolve(projectRoot, "node_modules")];

module.exports = config;
