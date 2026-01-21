/**
 * Système de logging centralisé
 * Remplace les console.log/error/warn pour un meilleur contrôle et formatage
 */

type LogLevel = "debug" | "info" | "warn" | "error"

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  data?: any
  error?: Error
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === "development"

  private formatMessage(entry: LogEntry): string {
    const prefix = `[${entry.timestamp}] [${entry.level.toUpperCase()}]`
    let message = `${prefix} ${entry.message}`

    if (entry.data) {
      message += `\n${JSON.stringify(entry.data, null, 2)}`
    }

    if (entry.error) {
      message += `\nError: ${entry.error.message}`
      if (entry.error.stack) {
        message += `\nStack: ${entry.error.stack}`
      }
    }

    return message
  }

  private log(level: LogLevel, message: string, data?: any, error?: Error) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      data,
      error,
    }

    // En production, ne pas logger les messages de debug
    if (!this.isDevelopment && level === "debug") {
      return
    }

    const formattedMessage = this.formatMessage(entry)

    switch (level) {
      case "debug":
        if (this.isDevelopment) {
          console.debug(formattedMessage)
        }
        break
      case "info":
        console.info(formattedMessage)
        break
      case "warn":
        console.warn(formattedMessage)
        break
      case "error":
        console.error(formattedMessage)
        // En production, on pourrait envoyer les erreurs à un service de monitoring (Sentry, etc.)
        break
    }
  }

  debug(message: string, data?: any) {
    this.log("debug", message, data)
  }

  info(message: string, data?: any) {
    this.log("info", message, data)
  }

  warn(message: string, data?: any) {
    this.log("warn", message, data)
  }

  error(message: string, error?: Error | any, data?: any) {
    const errorObj = error instanceof Error ? error : new Error(String(error))
    this.log("error", message, data, errorObj)
  }
}

// Export d'une instance singleton
export const logger = new Logger()

// Export aussi la classe pour les tests
export { Logger }

