function InvalidInviteError(message) {
    this.message = message;
    this.name = "InvalidInviteError";
    Error.captureStackTrace(this, InvalidInviteError);
}
InvalidInviteError.prototype = Object.create(Error.prototype);
InvalidInviteError.prototype.constructor = InvalidInviteError;

module.exports = InvalidInviteError;