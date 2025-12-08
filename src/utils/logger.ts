/**
 * Safe logging utility for MCP server context.
 *
 * MCP STDIO Transport Protocol:
 * - STDOUT: Reserved for JSON-RPC messages ONLY
 * - STDERR: May be used for logging (per MCP spec)
 *
 * When in MCP server mode, non-error logs default to STDERR to keep STDOUT clean for JSON-RPC.
 * Set MCP_LOG_STREAM=stdout to opt in to stdout logging if your host allows it.
 */

type LogLevel = "INFO" | "WARN" | "ERROR" | "DEBUG";

export class Logger {
  /**
   * Check if we're in MCP server mode (checked dynamically at each call)
   */
  private static isMCPServer(): boolean {
    return process.env.MCP_SERVER === "true";
  }

  // Step 1: Normalize the message with a clear level tag
  private static formatMessage(logLevel: LogLevel, message: string): string {
    return `[${logLevel}] ${message}`;
  }

  // Step 2: Decide which stream to use for non-error logs
  private static shouldUseStdout(
    logLevel: Exclude<LogLevel, "ERROR">
  ): boolean {
    if (this.isMCPServer()) {
      // In MCP mode keep stdout pristine unless explicitly opting in
      return process.env.MCP_LOG_STREAM === "stdout";
    }

    return true;
  }

  // Step 3: Emit to the selected stream with correct level semantics
  private static emit(
    logLevel: LogLevel,
    message: string,
    additionalArguments: any[]
  ): void {
    if (logLevel === "DEBUG" && process.env.DEBUG !== "true") {
      return;
    }

    const formattedMessage = this.formatMessage(logLevel, message);
    const isErrorLevel = logLevel === "ERROR";
    const logToStdout =
      !isErrorLevel &&
      this.shouldUseStdout(logLevel as Exclude<LogLevel, "ERROR">);

    if (logToStdout) {
      console.log(formattedMessage, ...additionalArguments);
      return;
    }

    console.error(formattedMessage, ...additionalArguments);
  }

  // Step 4: Public logging entry points
  static error(message: string, ...additionalArguments: any[]): void {
    this.emit("ERROR", message, additionalArguments);
  }

  static info(message: string, ...additionalArguments: any[]): void {
    this.emit("INFO", message, additionalArguments);
  }

  static warn(message: string, ...additionalArguments: any[]): void {
    this.emit("WARN", message, additionalArguments);
  }

  static debug(message: string, ...additionalArguments: any[]): void {
    this.emit("DEBUG", message, additionalArguments);
  }
}
