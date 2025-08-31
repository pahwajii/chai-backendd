import multer from "multer";
// this is how multer is configured for storing the files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {//cb->callback
    cb(null, "./public/temp")
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.originalname+ '-' + uniqueSuffix)
  }
})

export const upload = multer({
    storage: storage
    })