export const LOCALHOST = '127.0.0.1';

export const TESTER_PORT = 6969;

export const SERVER_PORT_TEMP = 8080;

export const SERVER_PORTS_FINAL = [8001, 8002, 8003, 8004];

export const FILE_EXECUTABLE_PERMS = 0o755;

export const BINARY_WAIT_TIME = 3000;

export const NUM_STAGES = 5;

/**
 * error types
 */
export enum ErrorTypes {
    VALIDATION_ERROR = 400,
    UNAUTHORIZED = 401,
    FORBIDDEN = 403,
    NOT_FOUND = 404,
    SERVER_ERROR = 500
};