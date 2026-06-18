import { Logger } from "tslog";

const logger = new Logger({
  name: "hewane-dashboard",
  minLevel: process.env.NODE_ENV === "production" ? 3 : 2, // 3 = warn, 2 = debug
  prettyLogTemplate:
    "{{yyyy}}.{{mm}}.{{dd}} {{hh}}:{{MM}}:{{ss}}:{{ms}} {{logLevelName}} {{name}} ",
});

export default logger;

export const apiLogger = (action: string, details?: Record<string, any>) => {
  logger.debug(`[API] ${action}`, details || {});
};

export const errorLogger = (action: string, error: unknown) => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;
  logger.error(`[ERROR] ${action}`, { message: errorMessage, stack: errorStack });
};

export const successLogger = (action: string, details?: Record<string, any>) => {
  logger.info(`[SUCCESS] ${action}`, details || {});
};
