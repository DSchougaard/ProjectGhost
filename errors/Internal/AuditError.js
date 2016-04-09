function AuditError(payload, error) {
    this.message = error;

    this.error = error;
    this.payload = payload;
    
    this.name = "AuditError";
    Error.captureStackTrace(this, AuditError);
}
AuditError.prototype = Object.create(Error.prototype);
AuditError.prototype.constructor = AuditError;

module.exports = AuditError;