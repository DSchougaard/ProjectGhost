function InviteDoesNotExistError(message) {
    this.message = message;
    this.name = "InviteDoesNotExistError";
    Error.captureStackTrace(this, InviteDoesNotExistError);
}
InviteDoesNotExistError.prototype = Object.create(Error.prototype);
InviteDoesNotExistError.prototype.constructor = InviteDoesNotExistError;

module.exports = InviteDoesNotExistError;