namespace Server.Services;

// Thrown for request-shape problems the controller should surface as 400
// (unknown template, missing required parameter/credential), as opposed to
// Azure/infra failures, which are caught and recorded on the entity instead.
public class ImplementacionValidationException(string message) : Exception(message);
