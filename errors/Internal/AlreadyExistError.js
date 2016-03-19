function AlreadyExistsError(entity) {
    this.message = entity + ' already exists';
    this.name = "AlreadyExistsError";
    Error.captureStackTrace(this, AlreadyExistsError);
}
AlreadyExistsError.prototype = Object.create(Error.prototype);
AlreadyExistsError.prototype.constructor = AlreadyExistsError;

module.exports = AlreadyExistsError;