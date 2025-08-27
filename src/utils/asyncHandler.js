const asyncHandler = (requestHandler) => {
    return (req,res,next) => {
        Promise
        .resolve(requestHandler(req,res,next))
        .catch((err)=> next(err))
    }
}
// This way, any error inside your async function is automatically caught and passed to Express’s error handler (next(err)), so you don’t need try–catch in every route.

export {asyncHandler}
//

/*ye dusra tareeka hai isse likhne ka as in async await try cath wrapper */
// const asyncHandler =  () => {}
// const asyncHandler =  (fn) => {() => {}}
// const asyncHandler =  (fn) => () => {}
// const asyncHandler =  (fn) => async() => {}


// const asyncHandler =  (fn) => async(req,res,next) => {
//     try {
//         await fn(req,res,next)
//     } catch (error) {
//         res.status(err.code || 500) .json({
//             success : false,
//             message : err.message,
//         })
//     }
// }