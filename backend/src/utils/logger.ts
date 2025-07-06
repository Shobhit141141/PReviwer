import chalk from 'chalk';

const successTag = chalk.bgGreen.black.bold(' SUCCESS ');
const errorTag = chalk.bgRed.white.bold(' ERROR ');
const infoTag = chalk.bgCyan.black.bold(' INFO ');
const warningTag = chalk.bgYellow.black.bold(' WARNING ');

export const logSuccess = (message: string) => {
  console.log(`${successTag} ${(message)}`);
};

export const logError = (message: string, error?: Error) => {
  console.error(`${errorTag} ${(error)}`);
  if (error) console.error((error.stack));
};

export const logInfo = (message: string) => {
  console.log(`${infoTag} ${(message)}`);
};

export const logWarning = (message: string) => {
  console.warn(`${warningTag} ${(message)}`);
};
  
export const logDebug = (debugTag: string, message: any) => {
  console.log(`${chalk.bgMagenta.black.bold(debugTag)} ${(message)}`);
};
