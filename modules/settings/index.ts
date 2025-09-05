import { settingsServiceUnified, settingsService, settingsServiceClient } from './services/settings-service-unified';
// import { Settings } from './models/setting';
import { Settings } from './services/settings-service-unified';

// Export unified service and legacy compatibility exports
export { settingsServiceUnified, settingsService, settingsServiceClient };
export type { Settings }; 