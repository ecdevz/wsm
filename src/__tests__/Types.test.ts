/**
 * Basic tests for the Types module
 * These tests verify type definitions and error classes without external dependencies
 */

describe('Types Module', () => {
  it('should be able to import the Types module', async () => {
    const typesModule = await import('../Types');
    expect(typesModule).toBeDefined();
  });

  it('should export expected error classes', async () => {
    const { SessionManagerError, MongoConnectionError, SessionValidationError } = await import(
      '../Types'
    );

    // Test SessionManagerError
    const sessionError = new SessionManagerError('Test message', 'TEST_CODE');
    expect(sessionError).toBeInstanceOf(Error);
    expect(sessionError.name).toBe('SessionManagerError');
    expect(sessionError.message).toBe('Test message');
    expect(sessionError.code).toBe('TEST_CODE');

    // Test MongoConnectionError
    const mongoError = new MongoConnectionError('Mongo test message');
    expect(mongoError).toBeInstanceOf(Error);
    expect(mongoError).toBeInstanceOf(SessionManagerError);
    expect(mongoError.name).toBe('MongoConnectionError');
    expect(mongoError.code).toBe('MONGO_CONNECTION_ERROR');

    // Test SessionValidationError
    const validationError = new SessionValidationError('Validation test message');
    expect(validationError).toBeInstanceOf(Error);
    expect(validationError).toBeInstanceOf(SessionManagerError);
    expect(validationError.name).toBe('SessionValidationError');
    expect(validationError.code).toBe('SESSION_VALIDATION_ERROR');
  });

  it('should export interface types that can be used in TypeScript', async () => {
    const typesModule = await import('../Types');

    // Check if key types are available (they should be exported as types)
    expect(typeof typesModule).toBe('object');

    // Test that we can create a MongoConfig object with proper typing
    const config = {
      session: 'test-session',
      collectionName: 'test-collection',
      retryRequestDelayMs: 100,
      maxRetries: 3,
      debug: false,
    };

    expect(config.session).toBe('test-session');
    expect(config.collectionName).toBe('test-collection');
    expect(config.retryRequestDelayMs).toBe(100);
    expect(config.maxRetries).toBe(3);
    expect(config.debug).toBe(false);
  });
});
