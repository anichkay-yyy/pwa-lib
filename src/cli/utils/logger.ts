import consola from 'consola'

export const logger = consola.withTag('pwa-lib')

export function success(message: string): void {
  logger.success(message)
}

export function info(message: string): void {
  logger.info(message)
}

export function warn(message: string): void {
  logger.warn(message)
}

export function error(message: string): void {
  logger.error(message)
}

export function box(message: string): void {
  logger.box(message)
}
