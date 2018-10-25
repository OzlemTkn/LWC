import {
    CompilerDiagnostic,
    CompilerError,
    generateCompilerError,
    generateCompilerDiagnostic,
    generateErrorMessage,
    normalizeToCompilerError,
    normalizeToDiagnostic
} from "../errors";

import { Location, DiagnosticLevel } from "../../shared/types";

const ERROR_INFO = {
    code: 4,
    message: "Test Error {0} with message {1}",
    level: DiagnosticLevel.Error
};

const GENERIC_ERROR = {
    code: 100,
    message: "Unexpected error: {0}",
    level: DiagnosticLevel.Error
};

class CustomError extends Error {
    public filename?: string;
    public line?: number;
    public column?: number;
    public lwcCode?: number;

    constructor(message: string, filename?: string, line?: number, column?: number) {
        super(message);

        this.name = 'CustomError';

        this.filename = filename;
        this.line = line;
        this.column = column;
    }
}

describe('error handling', () => {
    describe('generate compiler diagnostic', () => {
        it('generates a compiler diagnostic when config is null', () => {
            const target = {
                code: 4,
                message: 'LWC4: Test Error {0} with message {1}',
                level: DiagnosticLevel.Error
            };
            expect(generateCompilerDiagnostic(ERROR_INFO)).toEqual(target);
        });

        it('generates a compiler diagnostic when given a config', () => {
            const target = {
                code: 4,
                message: 'LWC4: Test Error arg1 with message 500',
                level: DiagnosticLevel.Error,
                filename: 'test.js',
                location: { line: 1, column: 22 }
            };

            expect(generateCompilerDiagnostic(ERROR_INFO, {
                messageArgs: ['arg1', 500],
                origin: {
                    filename: 'test.js',
                    location: { line: 1, column: 22 }
                }
            })).toEqual(target);
        });
    });

    describe('generate compiler error', () => {
        it('generates a compiler error when config is null', () => {
            const target = new CompilerError(4, 'LWC4: Test Error {0} with message {1}');

            expect(generateCompilerError(ERROR_INFO)).toEqual(target);
        });
        it('generates a compiler error based on the provided error info', () => {
            const args = ['arg1', 10];
            const target = new CompilerError(4, 'LWC4: Test Error arg1 with message 10');

            expect(generateCompilerError(ERROR_INFO, {
                messageArgs: args
            })).toEqual(target);
        });

        it('formats an error string properly', () => {
            const args = ['arg1', 10];
            const error = generateCompilerError(ERROR_INFO, {
                messageArgs: args
            });

            expect(error.message).toEqual('LWC4: Test Error arg1 with message 10');
        });

        it('adds the filename to the compiler error if it exists as context', () => {
            const args = ['arg1', 10];
            const filename = 'filename';

            const error = generateCompilerError(ERROR_INFO, {
                messageArgs: args,
                origin: { filename }
            });
            expect(error.filename).toEqual(filename);
        });

        it('adds the location to the compiler error if it exists as context', () => {
            const args = ['arg1', 10];
            const location = { line: 4, column: 27 };

            const error = generateCompilerError(ERROR_INFO, {
                messageArgs: args,
                origin: { location }
            });
            expect(error.location).toEqual(location);
        });
    });

    describe('normalizeToCompilerError', () => {
        it('preserves existing compiler error', () => {
            const error =  new CompilerError(100, 'LWC100: test err');
            expect(normalizeToCompilerError(GENERIC_ERROR, error)).toEqual(error);
        });

        it('adds origin info to an existing compiler error', () => {
            const filename = 'test.js';
            const location = { line: 1, column: 1 };

            const oldError = new CompilerError(100, 'LWC100: test error', 'old.js', { line: 1, column: 7 });
            const newError = new CompilerError(100, 'LWC100: test error', filename, location);

            expect(normalizeToCompilerError(GENERIC_ERROR, oldError, { filename, location })).toEqual(newError);
        });

        it('normalizes a given error into a compiler error', () => {
            const error = new CustomError('test error', 'test.js', 2, 5);
            const target = new CompilerError(100, 'CustomError: LWC100: Unexpected error: test error', 'test.js', { line: 2, column: 5});

            expect(normalizeToCompilerError(GENERIC_ERROR, error)).toEqual(target);
        });

        it('adds additional origin info into the normalized error if provided', () => {
            const error = new CustomError('test error');
            const target = new CompilerError(100, 'CustomError: LWC100: Unexpected error: test error', 'test.js', { line: 2, column: 5});

            expect(normalizeToCompilerError(GENERIC_ERROR, error, {
                filename: 'test.js',
                location: { line: 2, column: 5 }
            })).toEqual(target);
        });

        it('ignores the fallback errorInfo when an error code already exists on the error', () => {
            const message = generateErrorMessage(ERROR_INFO, ['arg1', 10]);
            const error = new CustomError(message);
            error.lwcCode = ERROR_INFO.code;

            const target = generateCompilerError(ERROR_INFO, {
                messageArgs: ['arg1', 10],
                origin: {
                    filename: 'test.js',
                    location: { line: 1, column: 1}
                }
            });
            target.message = `CustomError: ${target.message}`;

            expect(normalizeToCompilerError(GENERIC_ERROR, error, {
                filename: 'test.js',
                location: { line: 1, column: 1 }
            })).toEqual(target);
        });
    });

    describe('normalizeToDiagnostic', () => {
        it('normalizes a given compiler error into a diagnostic', () => {
            const target = {
                code: 100,
                message: 'LWC100: test error',
                level: DiagnosticLevel.Error,
                filename: 'test.js',
                location: { line: 1, column: 1 }
            };
            const error = new CompilerError(
                target.code, target.message, target.filename, target.location
            );

            expect(normalizeToDiagnostic(GENERIC_ERROR, error)).toEqual(target);
        });

        it('adds origin info to an existing compiler error when converting it to a diagnostic', () => {
            const target = {
                code: 100,
                message: 'LWC100: test error',
                level: DiagnosticLevel.Error,
                filename: 'test.js',
                location: { line: 1, column: 1 }
            };
            const error = new CompilerError(
                target.code, target.message, 'old.js', { line: 1, column: 7 }
            );

            expect(normalizeToDiagnostic(GENERIC_ERROR, error, {
                filename: target.filename,
                location: target.location
            })).toEqual(target);
        });

        it('normalizes a given error into a compiler diagnostic', () => {
            const error = new CustomError('test error', 'test.js', 2, 5);
            const target = {
                code: 100,
                message: 'LWC100: Unexpected error: test error',
                level: DiagnosticLevel.Error,
                filename: 'test.js',
                location: { line: 2, column: 5}
            };

            expect(normalizeToDiagnostic(GENERIC_ERROR, error)).toEqual(target);
        });

        it('adds additional origin info into the normalized diagnostic if provided', () => {
            const error = new CustomError('test error');
            const target = {
                code: 100,
                message: 'LWC100: Unexpected error: test error',
                level: DiagnosticLevel.Error,
                filename: 'test.js',
                location: { line: 2, column: 5}
            };

            expect(normalizeToDiagnostic(GENERIC_ERROR, error, {
                filename: 'test.js',
                location: { line: 2, column: 5 }
            })).toEqual(target);
        });
    });
});