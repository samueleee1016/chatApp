const HttpError = require("../errors/httpError");

class webSocketRateLimiter {
    constructor() {
        this.attempts = new Map();
        this.windowMs = 15 * 60 * 1000;
        this.maxAttempts = 5;

        setInterval(() => this.cleanup(), (this.windowMs) * 2);
    }

    check(identifier) {
            if(!identifier || typeof(identifier) !== 'string')
                throw new HttpError("identifier type in wsRateLimiter must be a non-empty string!");

            const now = Date.now();
            const record = this.attempts.get(identifier);

            if(!record || now > record.resetAt)
                {
                this.attempts.set(identifier, {
                    count: 1,
                    resetAt: now + this.windowMs
                });
                return {
                    allowed: true,
                    remaining: this.maxAttempts - 1,
                    resetAt: new Date(now + this.windowMs)
                };
                }

            if(record.count < this.maxAttempts)
                {
                record.count ++;
                return {
                    allowed: true,
                    remaining: this.maxAttempts - record.count,
                    resetAt: new Date(record.resetAt)
                };
                }
            
            return {
                allowed: false,
                remaining: 0,
                resetAt: new Date(record.resetAt)
            };
    }

    reset(identifier) {
        this.attempts.delete(identifier);
    }

    cleanup() {
        const now = Date.now();
        let cleaned = 0;

        for(const [key, record] of this.attempts.entries())
            {
            if(now > record.resetAt)
                {
                this.attempts.delete(key);
                cleaned++;
                }
            }

        if(cleaned > 0)
            console.log(`Rate limiter cleanup: rimossi ${cleaned} record`);
    }

    getStats() {
        return {
            totalTracked: this.attempts.size,
            records: Array.from(this.attempts.entries()).map(([key, value]) => ({
                identifier: key,
                attempts: value.count,
                resetAt: new Date(value.resetAt)
            }))
        };
    }
}

const wsRateLimiter = new webSocketRateLimiter();
const wsRateLimiterDeleteAccount = new webSocketRateLimiter();

module.exports = {wsRateLimiter, wsRateLimiterDeleteAccount};