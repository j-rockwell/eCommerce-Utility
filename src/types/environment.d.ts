declare global {
    namespace NodeJS {
        interface ProcessEnv {
            PRINTER_NAME: string;
            LIGHTSPEED_TOKEN: string;
            SENDLE_ID: string;
            SENDLE_APIKEY: string;
            DEBUG: boolean;
        }
    }
}

export {}