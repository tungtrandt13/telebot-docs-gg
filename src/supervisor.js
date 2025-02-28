const { spawn } = require('child_process');
const path = require('path');

class Supervisor {
    constructor() {
        this.restartCount = 0;
        this.maxRestarts = 5;
        this.restartDelay = 5000; // 5 seconds
        this.lastRestart = 0;
    }

    start() {
        console.log('Starting bot supervisor...');
        this.startBot();
    }

    startBot() {
        const bot = spawn('node', [path.join(__dirname, 'bot.js')], {
            stdio: 'inherit'
        });

        bot.on('exit', (code, signal) => {
            if (code !== 0) {
                this.handleCrash();
            }
        });

        bot.on('error', (err) => {
            console.error('Failed to start bot:', err);
            this.handleCrash();
        });
    }

    handleCrash() {
        const now = Date.now();
        if (now - this.lastRestart > 60000) { // Reset counter after 1 minute of stable operation
            this.restartCount = 0;
        }

        this.restartCount++;
        this.lastRestart = now;

        if (this.restartCount <= this.maxRestarts) {
            console.log(`Bot crashed. Restarting in ${this.restartDelay/1000} seconds... (Attempt ${this.restartCount}/${this.maxRestarts})`);
            setTimeout(() => this.startBot(), this.restartDelay);
        } else {
            console.error('Maximum restart attempts reached. Please check the logs and fix the issues.');
            process.exit(1);
        }
    }
}

new Supervisor().start();