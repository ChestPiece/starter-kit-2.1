import { executeGraphQLBackend } from "@/lib/graphql-server";
import { GET_SETTINGS_BY_ID, INSERT_SETTINGS, UPDATE_SETTINGS_BY_ID } from "./setting-graphql";

const settingsService = {
    getSettingsById: async () =>  {
        const response = await executeGraphQLBackend(GET_SETTINGS_BY_ID);
        return response?.settingsCollection?.edges[0]?.node || null;
    },
    updateSettingsById: async (data: any) => {
        const response = await executeGraphQLBackend(UPDATE_SETTINGS_BY_ID, { data });
        return response.updatesettingsCollection.affectedCount;
    },
    insertSettings: async (data: any) => {
        const response = await executeGraphQLBackend(INSERT_SETTINGS, { data });
        return response.insertIntosettingsCollection.records[0];
    }
}

export default settingsService;
