class ApiError extends Error {
    constructor(
        statusCode,
        message = "Something went wrong",
        errors = [],
        stack=""
    ){
        super(message)
        this.statusCode = statusCode
        this.data = null//assignment
        /*this.errors → stores any additional details (like validation errors).

this.success = false → useful when sending standardized API responses.

Error.captureStackTrace → ensures stack trace points to where the error was created.

this.data = null → placeholder for consistency with API responses. */
        this.errors = errors
        this.message = message
        this.success = false

//prodcuction me neeche wala code use hota ha 
        if(stack){
            this.stack = stack;
        }else{
            Error.captureStackTrace(this,this.constructor)
        }

    }
}

export {ApiError}