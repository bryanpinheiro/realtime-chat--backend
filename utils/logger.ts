import chalk from 'chalk';

class Log {
    info(message: string) {
        console.log(chalk.blueBright.bold(message));
    }

    error(message: string) {
        console.log(chalk.red.bold(message));
    }

    success(message: string) {
        console.log(chalk.greenBright.bold(message));
    }
}

export default new Log();